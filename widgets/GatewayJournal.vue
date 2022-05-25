<template>
<div class="calendar-container">
    <div class="calendar-navigation">
        <slot></slot>
        <div class="navigation-weeks">
            <span>{{ weekLabel }}</span>
            <div class="buttons-group buttons-group-only-icons">
                <a href="javascript:" class="button button-primary button-small" @click="prevWeek()">
                    <img svg-inline src="./../../svg/arrow-left.svg" class="icon" />
                </a>
                <a href="javascript:" class="button button-primary button-small" @click="nextWeek()">
                    <img svg-inline src="./../../svg/arrow-right.svg" class="icon" />
                </a>
            </div>
        </div>
    </div>
    <div class="calendar">
        <div class="calendar-header">
            <div class="calendar-header">
                <div class="calendar-row" v-bind:style="{width: `${calendarWidth}px`}">
                    <div class="cell cell-subject">&nbsp;</div>
                    <div class="cell cell-hour cell-hour-four-cells"
                         v-for="hour in (range + 1)">{{ formatHour(minFrom + hour - 1) }}:00</div>
                </div>
            </div>
        </div>
        <div class="calendar-body">
            <div class="calendar-row" v-bind:style="{width: `${calendarWidth}px`}" v-for="dayOfWeek in 7">
                <div class="cell cell-subject">{{ dateWithOffset(dayOfWeek - 1) }}</div>
                <template v-for="(hour, index) in (range + 1)">
                    <div v-for="segment in 4" class="cell"
                         v-bind:data-hour="hour-1 + getFrom(index)"
                         v-bind:data-segment="(segment - 1) * 15"
                         v-bind:class="{'with-event': hasEventsAt(dayOfWeek - 1, hour - 1 + getFrom(dayOfWeek - 1), (segment - 1) * 15)}"
                    >
                        <div class="event"
                             v-for="event in getEventsFor(dayOfWeek - 1, hour - 1 + getFrom(dayOfWeek - 1), (segment - 1) * 15)"
                             v-bind:class="{
                                 'event-future': typeof event.visited === 'undefined'
                             }"
                             v-bind:style="{
                                 width: `${minuteWidth * event.duration}px`,
                                 marginLeft: `${minuteWidth * event.offset}px`
                             }"
                        >
                            {{ event.group_id !== null || event.student_id !== null ? event.subject_name : event.subgroup_name }}
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
    <div class="calendar-footer">
        <div class="legend-item">
            <div class="legend-badge legend-badge-primary"></div>
            <span>Відвідав заняття</span>
        </div>
        <div class="legend-item">
            <div class="legend-badge legend-badge-danger"></div>
            <span>Пропуск</span>
        </div>
        <div class="legend-item">
            <div class="legend-badge legend-badge-gray"></div>
            <span>План</span>
        </div>
    </div>
</div>
</template>

<script>
import axios from 'axios'

export default {
    name: "GatewayJournal",
    props: [ 'studentId', 'studentJournalUrl', 'schoolSchedule', 'startOfWeek' ],
    data() {
        return {
            calendarWidth: 0,
            workSchedule: [],
            minFrom: 25,
            maxUntil: 0,
            range: 0,
            startDay: null,

            startOfWeekDay: null,
            endOfWeekDay: null,
            events: {},
            minuteWidth: 0
        };
    },
    computed: {
        weekLabel() {
            const {startOfWeekDay: startOfWeek, endOfWeekDay: endOfWeek} = this;

            if (startOfWeek === null || endOfWeek === null) {
                return '';
            }

            let startDay = startOfWeek.getDate();
            let endDay = endOfWeek.getDate();

            startDay = `00${startDay}`.substr(-2);
            endDay = `00${endDay}`.substr(-2);

            const months = [ 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря' ];
            const startMonth = months[startOfWeek.getMonth()];
            const endMonth = months[endOfWeek.getMonth()];

            if (startOfWeek.getFullYear() !== endOfWeek.getFullYear()) {
                return `${startDay} ${startMonth} ${startOfWeek.getFullYear()} - ${endDay} ${endMonth} ${endOfWeek.getFullYear()} г.`;
            }

            if (startMonth !== endMonth) {
                return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endOfWeek.getFullYear()} г.`;
            }

            return `${startDay} - ${endDay} ${endMonth} ${endOfWeek.getFullYear()} г.`;
        },
        currentUrl() {
            const start = [];
            const end = [];
            start.push(this.startOfWeekDay.getDate());
            start.push(this.startOfWeekDay.getMonth());
            start.push(this.startOfWeekDay.getFullYear());
            end.push(this.endOfWeekDay.getDate());
            end.push(this.endOfWeekDay.getMonth());
            end.push(this.endOfWeekDay.getFullYear());

            start[0] = `00${start[0]}`.substr(-2);
            start[1] = `00${start[1] + 1}`.substr(-2);

            end[0] = `00${end[0]}`.substr(-2);
            end[1] = `00${end[1] + 1}`.substr(-2);

            return `${this.studentJournalUrl}?start=${start.join('.')}&end=${end.join('.')}`;
        }
    },
    mounted() {
        if (typeof this.schoolSchedule !== "undefined") {
            this.workSchedule = JSON.parse(this.schoolSchedule);
        } else {
            this.workSchedule = [];
            for (let i = 0; i < 7; i++) {
                this.workSchedule.push({ from: 8, until: 20 });
            }
        }

        for (let day of this.workSchedule) {
            if (this.minFrom > Number(day.from) && Number(day.from) > 0) {
                this.minFrom = Number(day.from);
            }

            if (this.maxUntil < Number(day.until)) {
                this.maxUntil = Number(day.until);
            }
        }

        this.range = this.maxUntil - this.minFrom;

        if (typeof this.startOfWeek !== "undefined") {
            const _day = this.startOfWeek.split('.');
            this.startOfWeekDay = new Date(_day[2], _day[1] - 1, _day[0]);
            this.endOfWeekDay = new Date(_day[2], _day[1] - 1, _day[0]);
            this.endOfWeekDay.setDate(this.endOfWeekDay.getDate() + 6);
        } else {
            this.startOfWeekDay = new Date();
            this.endOfWeekDay = new Date();
            this.endOfWeekDay.setDate(this.endOfWeekDay.getDate() + 6);
        }

        window.setTimeout(() => {
            const cells = document.querySelectorAll('.calendar-header .cell');
            const cellElement = document.querySelector('.calendar .calendar-body .cell:not(.cell-subject)');
            let totalWidth = 0;
            for (let i = 0; i < cells.length; i++) {
                totalWidth += cells[i].offsetWidth;
            }
            this.calendarWidth = totalWidth;
            this.minuteWidth = cellElement.offsetWidth / 15;
        }, 100);

        this.reload();
    },
    methods: {
        reload() {
            axios.get(this.currentUrl)
                .then(response => response.data)
                .then(response => this.events = response)
                .then(response => console.log(this.events))
            ;
        },
        formatHour(hour) {
            return `00${hour}`.substr(-2);
        },
        dateWithOffset(offset) {
            if (this.startOfWeekDay === null) {
                return ;
            }

            let date = new Date();
            date.setDate(this.startOfWeekDay.getDate() + offset);

            const day = `00${date.getDate()}`.substr(-2);
            const month = `00${date.getMonth() + 1}`.substr(-2);

            const days = [
                'Понеділок',
                'Вівторок',
                'Середа',
                'Четвер',
                'П\'ятниця',
                'Субота',
                'Неділя'
            ];

            let dayOfWeek = date.getDay() - 1;
            dayOfWeek = dayOfWeek < 0 ? 6 : dayOfWeek;

            return `${days[dayOfWeek]} ${day}.${month}`;
        },
        hasEventsAt(dayOfWeek, hour, minute) {
            if (typeof this.events[dayOfWeek] === "undefined") {
                return false;
            }
            if (typeof this.events[dayOfWeek][hour] === "undefined") {
                return false;
            }
            if (typeof this.events[dayOfWeek][hour][minute] === "undefined") {
                return false;
            }

            return true;
        },
        getEventsFor (dayOfWeek, hour, minute) {
            if (!this.hasEventsAt(dayOfWeek, hour, minute)) {
                return [];
            }

            return this.events[dayOfWeek][hour][minute];
        },
        getFrom(index) {
            if (typeof this.workSchedule[index] === "undefined") {
                return 0;
            }

            return Number(this.workSchedule[index].from);
        },
        nextWeek() {
            this.changeDay(7);
        },
        prevWeek() {
            this.changeDay(-7);
        },
        changeDay(delta) {
            const tempStart = new Date(this.startOfWeekDay);
            const tempEnd = new Date(this.endOfWeekDay);

            tempStart.setDate(tempStart.getDate() + delta);
            tempEnd.setDate(tempEnd.getDate() + delta);

            this.startOfWeekDay = tempStart;
            this.endOfWeekDay = tempEnd;
            this.reload();
        }
    }
}
</script>

<style scoped>

</style>
