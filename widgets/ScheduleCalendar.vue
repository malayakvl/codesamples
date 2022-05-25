<template>
<div class="calendar-container widget-calendar">
    <form class="card-header calendar-card-header two-levels form" v-if="variant === 'large'">
        <div class="first-level">
            <div>
                <custom-select v-bind:options="audiences"
                               with-select-all="true"
                               with-remove-all="true"
                               with-search="true"
                               multiple="true"
                               id-key="id"
                               value-key="name"
                               placeholder="Усі аудиторії"
                               detach-popup="true"
                               show-selected="false"
                               show-selected-badge="true"
                               @change="updateFilter('audiences', $event)" />
            </div>
            <div>
                <custom-select v-bind:options="teachers"
                               with-select-all="true"
                               with-remove-all="true"
                               with-search="true"
                               multiple="true"
                               id-key="id"
                               value-key="full_name"
                               placeholder="Всі вчителі"
                               detach-popup="true"
                               show-selected-badge="true"
                               show-selected="false" @change="updateFilter('teachers', $event)" />
            </div>
            <div>
                <custom-select v-bind:options="groups"
                               with-select-all="true"
                               with-remove-all="true"
                               with-search="true"
                               multiple="true"
                               id-key="id"
                               value-key="full_name"
                               placeholder="Всі групи"
                               detach-popup="true"
                               show-selected-badge="true"
                               show-selected="false" @change="updateFilter('groups', $event)" />
            </div>
            <div>
                <custom-select v-bind:options="subgroups"
                               with-select-all="true"
                               with-remove-all="true"
                               with-search="true"
                               multiple="true"
                               id-key="id"
                               value-key="name"
                               placeholder="Всі підгрупи"
                               detach-popup="true"
                               show-selected-badge="true"
                               show-selected="false" @change="updateFilter('subgroups', $event)" />
            </div>
            <div>
                <custom-select v-bind:options="subjectTypes"
                               with-select-all="true"
                               with-remove-all="true"
                               with-search="true"
                               multiple="true"
                               id-key="id"
                               value-key="value"
                               placeholder="Всі типи предметів"
                               detach-popup="true"
                               show-selected-badge="true"
                               show-selected="false" @change="updateFilter('subject_types', $event)" />
            </div>
            <div>
                <custom-select v-bind:options="students"
                               with-select-all="true"
                               with-remove-all="true"
                               with-search="true"
                               multiple="true"
                               id-key="id"
                               value-key="full_name"
                               placeholder="Всі учні"
                               detach-popup="true"
                               show-selected-badge="true"
                               show-selected="false" @change="updateFilter('students', $event)" />
            </div>
        </div>
        <div class="clearfix"></div>
        <div class="second-level">
            <div class="week-select">
                <div class="week-label">{{ weekLabel }}</div>
                <div class="select-a-week" @click="toggleWeekPopup()"><img svg-inline src="./../../svg/dropdown-icon.svg" class="icon" /></div>
                <div class="buttons-group buttons-group-only-icons">
                    <a href="javascript:" class="button button-primary button-small" @click.prevent="prevWeek()">
                        <img svg-inline src="./../../svg/arrow-left.svg" class="icon" />
                    </a>
                    <a href="javascript:" class="button button-primary button-small">
                        <img svg-inline src="./../../svg/arrow-right.svg" class="icon" @click.prevent="nextWeek()" />
                    </a>
                </div>
                <div class="popup-calendar-container">
                    <calendar-popup select-week="true"
                                    close-automatically="true"
                                    v-bind:value="startOfWeekDay"
                                    v-if="isShowWeekPopup"
                                    @change="updateWeek($event)"
                                    @close="closeCalendarPopup()" />
                </div>
            </div>
            <div class="days-of-week">
                <nav class="tabs tabs-small-margin">
                    <a href="javascript:" v-bind:class="{active: isActiveDay(0)}" @click="changeDayOfWeek(0)"><span data-day-of-week-span>Пн, {{ dateFor(0) }}</span></a>
                    <a href="javascript:" v-bind:class="{active: isActiveDay(1)}" @click="changeDayOfWeek(1)"><span data-day-of-week-span>Вт, {{ dateFor(1) }}</span></a>
                    <a href="javascript:" v-bind:class="{active: isActiveDay(2)}" @click="changeDayOfWeek(2)"><span data-day-of-week-span>Ср, {{ dateFor(2) }}</span></a>
                    <a href="javascript:" v-bind:class="{active: isActiveDay(3)}" @click="changeDayOfWeek(3)"><span data-day-of-week-span>Чт, {{ dateFor(3) }}</span></a>
                    <a href="javascript:" v-bind:class="{active: isActiveDay(4)}" @click="changeDayOfWeek(4)"><span data-day-of-week-span>Пт, {{ dateFor(4) }}</span></a>
                    <a href="javascript:" v-bind:class="{active: isActiveDay(5)}" @click="changeDayOfWeek(5)"><span data-day-of-week-span>Сб, {{ dateFor(5) }}</span></a>
                    <a href="javascript:" v-bind:class="{active: isActiveDay(6)}" @click="changeDayOfWeek(6)"><span data-day-of-week-span>Нд, {{ dateFor(6) }}</span></a>
                </nav>
            </div>
        </div>
    </form>
    <div class="card-header" v-if="variant === 'small' || variant === 'student'">
        <div class="card-icon">
            <img src="/assets/icons/calendar.png" />
        </div>
        <div class="card-title">{{ cardTitle }}</div>
        <div class="card-actions">
            <a href="javascript:" class="button button-small button-link" @click.prevent="setToday()">Сьогодні</a>
            <div class="action-spacer"></div>
             <div class="buttons-group buttons-group-only-icons">
                <a href="javascript:" class="button button-primary button-small" @click.prevent="prevDay()">
                    <img svg-inline src="./../../svg/arrow-left.svg" class="icon" />
                </a>
                <a href="javascript:" class="button button-primary button-small">
                    <img svg-inline src="./../../svg/arrow-right.svg" class="icon" @click.prevent="nextDay()" />
                </a>
            </div>
        </div>
    </div>
    <div v-bind:class="{'card-content': isCard, 'lock-loading': lockCalendar}">
        <div class="calendar" v-bind:class="{'with-hover-event': eventHover !== 0}">
            <div class="calendar-header">
                <div class="calendar-row" v-bind:style="{width: `${calendarWidth}px`}">
                    <div class="cell cell-subject">Аудиторія</div>
                    <div class="cell cell-hour cell-hour-four-cells"
                         v-for="hour in (workingHours + 1)">{{ hourWithOffset(hour - 1) }}:00</div>
                </div>
            </div>
            <div class="calendar-body">
                <div class="lock" v-bind:data-label="currentTime"
                     v-bind:style="{left: `${currentTimeLeft}px`}"
                     v-if="isEditable ? isToday : true"></div>
                <div v-for="(audience, index) in filteredAudiences()" class="calendar-row"
                     v-bind:style="{width: `${calendarWidth}px`}"
                     v-bind:data-subjects="isEditable ? audience.subjects.join(';') : ''"
                     v-bind:data-instruments="isEditable ? audience.instruments.join(';') : ''"
                     v-bind:data-index="index">
                    <div class="cell cell-subject">{{ audience.name }}</div>
                    <template v-for="hour in (workingHours + 1)">
                        <div v-for="segment in 4" class="cell"
                             v-bind:data-hour="hour - 1"
                             v-bind:data-minute="(segment - 1) * 15"
                             v-bind:data-audience-id="audience.id"
                             v-bind:class="{'with-event': hasEventsAt(audience.id, hour - 1, (segment - 1) * 15)}"
                        >
                            <div class="event"
                                 v-for="event in getEventsFor(audience.id, hour - 1, (segment - 1) * 15)"
                                 v-bind:style="{
                                     width: getEventWidth(event),
                                     marginLeft: getOffsetInPx(event),
                                     zIndex: getEventZIndex(event)
                                 }"
                                 v-bind:class="{
                                     'lock-loading': typeof event.id === 'undefined',
                                     'event-individual': event.subject_type === 'individual',
                                     'event-one-time': event.eventType === 'one-time' || event.event_type === 'one-time',
                                     'event-repeat': event.eventType === 'repeat' || event.event_type === 'repeat',
                                     'event-group': event.subject_type === 'group',
                                     'highlight-event': eventHover === event.id,
                                     'event-danger': event.type === 2,
                                 }"
                                 v-bind:id="`event-${event.id}`"
                                 v-bind:data-subject-id="event.type !== 2 ? event.subject_id : null"
                                 @contextmenu.prevent="handleContext($event, event, hour - 1, (segment - 1) * 15, audience.id)"
                                 @mouseover="highlightEvent(event)"
                                 @mouseleave="removeEventHighlight()"
                            >
                                <span v-if="event.duration >= 22.5">{{ event.title }}</span>
                                <div class="event-popup-description ribbon-item"
                                     v-if="event !== null"
                                     v-bind:data-subject-id="event.type !== 2 ? event.subject_id : null">
                                    <b class="ribbon-item-title">{{ event.title }}</b>
                                    <span>{{ event.subject_name }} ({{ getSubjectType(event.subject_type) }})</span>
                                    <span class="additional-text">Тривалість:  <span class="lesson-duration">{{ (Number(event.duration) / 45).toFixed(2) }}</span> академ. час</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>

    <div class="event-popup-description ribbon-item"
         v-if="highlightedEvent !== null"
         v-bind:class="{
           group: highlightedEvent.subject_type !== 'individual',
           individual: highlightedEvent.subject_type === 'individual'
         }"
         v-bind:style="{top: `${highlightedOffset.top + highlightedOffset.height + 8}px`, left: `${highlightedOffset.left}px`}"
         v-bind:data-subject-id="highlightedEvent.type !== 2 ? highlightedEvent.subject_id : null">
      <b class="ribbon-item-title">{{ highlightedEvent.title }}</b>
        <span v-if="highlightedEvent.subject_name">{{ highlightedEvent.subject_name }} ({{ getSubjectType(highlightedEvent.subject_type) }})</span>
        <span v-if="highlightedEvent.teacher_full_name">Викладач: {{ highlightedEvent.teacher_full_name }}</span>
      <span class="additional-text">Тривалість:  <span class="lesson-duration">{{ (Number(highlightedEvent.duration) / 45).toFixed(2) }}</span> академ. час</span>
    </div>

    <div class="drag-preview-placeholder" ref="dragPreviewPlaceholder" v-bind:class="{invisible: !isDragging}" v-if="isEditable"></div>
    <div class="calendar-context-menu" ref="contextMenu" v-bind:class="{invisible: !isContextVisible}" v-if="isEditable">
        <a href="javascript:"
           v-if="contextType === 'default' && currentEvent !== null && (currentEvent.eventType !== 'one-time' && currentEvent.event_type !== 'one-time')"
           @click="removeEvent(true, false, deleteAll = true)"
           v-bind:class="{disabled: isPastEvent(currentEvent) || (currentEvent.onetime && currentEvent.type === 2)}"
        >Видалити всі</a>
        <a href="javascript:"
           v-if="contextType === 'default' && currentEvent !== null && (currentEvent.eventType === 'one-time' || currentEvent.event_type === 'one-time')"
           @click="removeEvent()"
        >Видалити</a>
        <a href="javascript:"
           v-if="contextType === 'default' && currentEvent !== null && (currentEvent.eventType !== 'one-time' && currentEvent.event_type !== 'one-time')"
           @click="removeSingleEvent()"
           v-bind:class="{disabled: isPastEvent(currentEvent) || (currentEvent.onetime && currentEvent.type === 2)}"
        >Відмінити</a>
        <a href="javascript:"
           v-if="contextType === 'default' && currentEvent !== null && (currentEvent.eventType !== 'one-time' && currentEvent.event_type !== 'one-time')"
           @click="removeEventOnlyToday()"
           v-bind:class="{disabled: isPastEvent(currentEvent) || currentEvent.type === 2}"
        >Відмінити лише {{ currentDayLabel }}</a>
        <a href="javascript:"
           v-if="contextType === 'default' && currentEvent !== null && (currentEvent.eventType !== 'one-time' && currentEvent.event_type !== 'one-time')"
           @click="removeFullEventOnlyToday()"
           v-bind:class="{disabled: isPastEvent(currentEvent) || currentEvent.type === 2}"
        >Видалити лише {{ currentDayLabel }}</a>
        <a href="javascript:"
           v-if="contextType === 'default' && currentEvent !== null"
           @click="reactivate()"
           v-bind:class="{disabled: isPastEvent(currentEvent) || currentEvent.type !== 2}"
        >Поновити</a>

        <div class="divider" v-if="contextType === 'default'"></div>

        <a href="javascript:" v-if="contextType === 'default'"
           v-bind:class="{disabled: isPastEvent(currentEvent)}"
           @click="moveEvent()">Перемістити</a>
        <a href="javascript:" v-if="contextType === 'default'"
           v-bind:class="{disabled: isPastEvent(currentEvent)}"
           @click="moveToOtherDay()">Змінити день</a>
        <a href="javascript:" v-if="contextType === 'default' && currentEvent !== null"
           v-bind:class="{disabled: isPastEvent(currentEvent) || (currentEvent.onetime && currentEvent.type === 2)}"
           @click="editEvent()">Редагувати</a>
        <a href="javascript:" v-if="contextType === 'move'" @click="moveEventAt()">Перемістити лише {{ currentDayLabel }}</a>
        <a href="javascript:" v-if="contextType === 'move' && currentEvent !== null"
           @click="moveEventAfter()"
           v-bind:class="{disabled: currentEvent.onetime}"
        >Перемістити з {{ currentDayLabel }}</a>
        <a href="javascript:" v-if="contextType === 'move'" @click="moveCancel()">Відміна</a>

        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="changeDayOfWeekAndMove(0)">Понеділок</a>
        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="changeDayOfWeekAndMove(1)">Вівторок</a>
        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="changeDayOfWeekAndMove(2)">Середа</a>
        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="changeDayOfWeekAndMove(3)">Четвер</a>
        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="changeDayOfWeekAndMove(4)">П'ятниця</a>
        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="changeDayOfWeekAndMove(5)">Субота</a>
        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="changeDayOfWeekAndMove(6)">Неділя</a>
        <div class="divider" v-if="contextType === 'dayOfWeek'"></div>
        <a href="javascript:" v-if="contextType === 'dayOfWeek'" @click="cancelMoveDayOfWeek()">Відміна</a>
    </div>

    <popup is-form="false"
           title="Заняття"
           v-bind:visible="showPopup"
           v-bind:is-locked="lockPopup"
           v-bind:is-apply-locked="!isTimeAvailable"
           id="test"
           v-bind:modal="isPopupModal"
           managed="true"
           v-if="currentEvent !== null && isEditable"
           @close="discardEvent()"
           @apply="applyEvent()"
    >
        <div class="alert alert-danger alert-messages-list offset-bottom-large" v-if="errors.length > 0 || !isTimeAvailable">
            <ul>
                <li class="message" v-for="error in errors">{{ error }}</li>
                <li class="message" v-if="!isTimeAvailable">Вибраний час недоступний</li>
            </ul>
        </div>

        <div class="form-group">
            <label>Тривалість заняття</label>
            <custom-number-input v-bind:value="currentEvent.duration" v-bind:max="maxTimeLeft" native-step="0.1" step="15" min="0" @change="updateDuration($event)" />
        </div>

        <div class="form-group form-group-checkbox offset-bottom-medium" v-if="currentEvent.eventType !== 'one-time'">
            <label>
                <input type="checkbox" name="onetime" value="1" v-bind:checked="currentEvent.onetime" @change="toggleOnetime()" />
                <div class="checkbox-placeholder"></div>
                <span class="label-value">Одноразове заняття</span>
            </label>
        </div>

        <div class="columns two-columns small-gap">
            <div class="form-group">
                <label>Час початку</label>
                <custom-number-input v-bind:value="currentEvent.hour + Number(currentWorkSchedule.from)"
                                     v-bind:min="Number(currentWorkSchedule.from)"
                                     v-bind:max="Number(currentWorkSchedule.until)" step="1" @change="updateHour($event)" />
            </div>
            <div class="form-group">
                <label>Хвилина початку</label>
                <custom-number-input v-bind:value="currentEvent.minute" step="1" @change="updateMinute($event)" min="0" max="59" />
            </div>
        </div>

        <div class="form-group" v-if="currentEvent.eventType !== 'one-time'">
            <label>Викладач</label>
            <custom-select name="teacher_id"
                           value-key="full_name"
                           id-key="id"
                           placeholder="Викладач"
                           with-search="true"
                           v-bind:options="teachers"
                           v-bind:selected-by-default="currentEvent.teacher_id"
                           @change="updateTeacher($event)"
            />
        </div>
        <div class="form-group" v-if="currentEvent.accompanist === 1">
            <label>Концертмейстер</label>
            <custom-select name="teacher_id"
                           value-key="full_name"
                           id-key="id"
                           placeholder="Викладач"
                           with-search="true"
                           v-bind:options="getTeachersAccompanist()"
                           v-bind:selected-by-default="currentEvent.teacher_accompanist_id"
                           @change="updateTeacherAccompanist($event)"
            />
        </div>
    </popup>

    <popup is-form="false"
           title="Відмінити заняття"
           v-bind:visible="isClearBetweenVisible"
           v-bind:is-locked="isClearBetweenLocked"
           id="lock-between"
           v-bind:modal="true"
           managed="true"
           v-if="isClearBetweenVisible && isEditable"
           @close="closeBetweenPopup()"
           @apply="applyBetween()"
    >
        <div class="range-container input-select range-select no-border">
            <div class="range-select" @click="toggleCalendar()">
                <div class="input-value">{{ rangeLabel }}</div>
                <div class="icon-container">
                    <img svg-inline src="./../../svg/dropdown-icon.svg" class="custom-select-item" />
                </div>
            </div>
            <calendar-popup v-bind:select-range="true"
                            v-bind:close-automatically="true"
                            v-bind:value="new Date()"
                            v-bind:select-week="false"
                            v-bind:range-start="formatDate(rangeStart)"
                            v-bind:range-end="formatDate(rangeEnd)"
                            v-if="betweenCalendarVisible"
                            @changeRange="updateRange($event)"
                            @close="toggleCalendar()"
            ></calendar-popup>
        </div>
    </popup>
</div>
</template>

<script>
import bus from '../bus'
import lodash from 'lodash'
import loadMoreLessons from '../actions/load-more-lessons.js'

const CELL_WIDTH = 55;
const MINUTE_WIDTH = CELL_WIDTH / 15;
export default {
    name: "ScheduleCalendar",
    props: [
        'variant',
        'isCard',
        'schoolSchedule',
        'scheduleUrl',
        'schoolAudiences',
        'teachers',
        'placeEventUrl',
        'placeSingleEventUrl',
        'placeRepeatEventUrl',
        'updateLessonsUrl',
        'initialEvents',
        'startOfWeek',
        'deleteEventUrl',
        'skipAtUrl',
        'skipAfterUrl',
        'moveEventUrl',
        'updateEventUrl',
        'clearTodayUrl',
        'reactivateUrl',
        'editable',
        'cardTitle',

        'groups', 'subgroups', 'students'
    ],
    data() {
        return {
            dayOfWeek: 0,
            workSchedule: [],
            audiences: [],
            events: {},

            lockCalendar: false,

            mouseMove: null,
            mouseUp: null,
            mouseDown: null,

            isDragging: false,
            dragItem: null,
            previewOffset: 10,
            debounceMouseMove: null,
            targetCell: null,

            isContextVisible: false,
            currentEvent: null,
            contextForHour: 0,
            contextForMinute: 0,
            contextForAudience: 0,
            lessonEvents: {},
            contextType: 'default',

            showPopup: false,
            startOfWeekDay: null,
            endOfWeekDay: null,
            lockPopup: false,
            errors: [],
            popupMode: 'default',

            isShowWeekPopup: false,
            calendarWidth: 0,

            scheduleDay: new Date(),
            contextTarget: null,

            newHour: 0,
            newMinute: 0,
            newAudienceId: 0,

            filters: {},
            subjectTypes: [ { id: 'individual', value: 'Индивидуальные' }, { id: 'group', value: 'Групповые' } ],
            subjectWidth: 0,
            cellWidth: 0,
            currentTime: null,
            currentTimeLeft: -300,
            currentTimeInMinutes: 0,
            minuteWidth: 0,

            eventHover: 0,

            timeLeft: {},
            initialDuration: 0,
            initialMinute: 0,
            initialHour: 0,

            highlightedEvent: null,
            highlightedOffset: { top: 0, left: 0, height: 0 },

            moveToOtherDayFrom: null,

            isClearBetweenVisible: false,
            isClearBetweenLocked: false,
            betweenCalendarVisible: false,
            rangeStart: null,
            rangeEnd: null
        };
    },
    computed: {
        rangeLabel() {
            if (this.rangeStart == null || this.rangeEnd === null) {
                return 'Період';
            }

            return `${this.formatDate(this.rangeStart)} - ${this.formatDate(this.rangeEnd)}`;
        },
        maxTimeLeft() {
            const lessonId = Number(this.currentEvent.lesson_id);
            if (typeof this.timeLeft[lessonId] === "undefined") {
                return this.initialDuration;
            }

            if (this.popupMode === 'edit') {
                return this.timeLeft[lessonId] + this.currentEvent.initial_duration;
            }

            return this.timeLeft[lessonId];
        },
        isEditable() {
            return typeof this.editable !== "undefined" && this.editable === "true";
        },
        currentWorkSchedule() {
            return this.getWorkSchedule(this.dayOfWeek);
        },
        workingHours() {
            const schedule = this.currentWorkSchedule;
            const until = schedule.until || 0;
            const workFrom = schedule.from || 0;
            return until - workFrom;
        },
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
        currentDay() {
            const {startOfWeekDay: startOfWeek, dayOfWeek} = this;
            if (startOfWeek === null) {
                return new Date();
            }

            const day = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() +  dayOfWeek);
            return day;
        },
        isToday() {
            return this.currentDay.getDate() === new Date().getDate();
        },
        currentDayLabel() {
            const currentDay = this.currentDay;
            let day = currentDay.getDate();
            let month = currentDay.getMonth();

            day = `00${day}`.substr(-2);
            month = `00${month + 1}`.substr(-2);

            return `${day}.${month}.${currentDay.getFullYear()}`;
        },
        isTimeAvailable() {
            let {audience_id} = this.currentEvent;

            if (typeof this.events[this.dayOfWeek] === "undefined"
                || typeof this.events[this.dayOfWeek][audience_id] === "undefined"
            ) {
                return true;
            }

            const events = this.events[this.dayOfWeek][audience_id];
            const takenIntervals = [];
            const workFrom = Number(this.currentWorkSchedule.from);
            const workUntil = Number(this.currentWorkSchedule.until);

            for (let _hour in events) {
                let hour = Number(_hour) + workFrom;
                for (let _minute in events[_hour]) {
                    const minute = Number(_minute);
                    for (let event of events[_hour][_minute]) {
                        if (event.id === this.currentEvent.id) {
                            continue ;
                        }

                        const startTime = new Date();
                        const endTime = new Date();
                        startTime.setHours(hour);
                        endTime.setHours(hour);
                        startTime.setMinutes(minute + event.offset);
                        endTime.setMinutes(minute + event.offset + event.duration);
                        startTime.setSeconds(0);
                        endTime.setSeconds(59);
                        startTime.setMilliseconds(0);
                        endTime.setMilliseconds(99);

                        takenIntervals.push(startTime, endTime);
                    }
                }
            }

            const dayStart = new Date();
            const dayEnd = new Date();
            dayStart.setHours(workFrom);
            dayStart.setMinutes(0);
            dayStart.setSeconds(0);
            dayStart.setMilliseconds(0);

            dayEnd.setHours(workUntil);
            dayEnd.setMinutes(59);
            dayEnd.setSeconds(59);
            dayEnd.setMilliseconds(99);

            takenIntervals.unshift(dayStart);
            takenIntervals.push(dayEnd);

            const pairs = [];
            const pairsCount = takenIntervals.length / 2;
            for (let i = 0; i < pairsCount; i++) {
                let items = takenIntervals.splice(0, 2);
                items[0].setSeconds(0);
                items[0].setMilliseconds(0);
                items[1].setSeconds(59);
                items[1].setMilliseconds(99);
                pairs.push(items);
            }

            const {hour, minute, duration, offset} = this.currentEvent;
            const needStart = new Date();
            const needEnd = new Date();

            const startHour = workFrom + hour;
            let startMinute = minute;

            if (typeof offset !== "undefined") {
                startMinute += offset;
            }

            needStart.setHours(startHour);
            needStart.setMinutes(startMinute);
            needStart.setSeconds(0);
            needStart.setMilliseconds(0);

            needEnd.setHours(startHour);
            needEnd.setMinutes(startMinute + duration);
            needEnd.setSeconds(59);
            needEnd.setMilliseconds(0);

            return pairs
                .filter(item => needStart >= item[0] && needStart <= item[1])
                .filter(item => needEnd >= item[0] && needEnd <= item[1])
                .length > 0;
        },
        isPopupModal() {
            return this.popupMode === 'default';
        }
    },
    mounted() {
        const today = new Date();
        let dayOfWeek = today.getDay();
        dayOfWeek--;
        if (dayOfWeek < 0) {
            dayOfWeek = 6;
        }

        this.dayOfWeek = dayOfWeek;

        if (typeof this.schoolSchedule !== "undefined") {
            this.workSchedule = JSON.parse(this.schoolSchedule);
        } else {
            this.workSchedule = [];
            for (let i = 0; i < 7; i++) {
                this.workSchedule.push({ from: 8, until: 20 });
            }
        }

        if (typeof this.schoolAudiences !== "undefined") {
            this.audiences = JSON.parse(this.schoolAudiences);
        }

        // if (typeof this.initialEvents !== "undefined") {
        //     this.events = JSON.parse(this.initialEvents);
        // }

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

        this.mouseMove = (e) => this.globalMouseMove(e);
        this.mouseUp = (e) => this.globalMouseUp(e);
        this.mouseDown = (e) => this.globalMouseDown(e);

        this.debounceMouseMove = lodash.debounce((e) => this.debouncedMouseMove(e), 25);

        document.addEventListener('mousemove', this.mouseMove);
        document.addEventListener('mouseup', this.mouseUp);
        document.addEventListener('mousedown', this.mouseDown);

        if (this.variant === 'small') {
            this.loadEvents(new Date());
        } else {
            this.loadEvents();
        }

        this.bindEventsToLessons();
        this.updateLessonsList();

        window.setTimeout(() => {
            const cells = document.querySelectorAll('.calendar-header .cell');
            let totalWidth = 0;
            for (let i = 0; i < cells.length; i++) {
                totalWidth += cells[i].offsetWidth;
            }
            this.calendarWidth = totalWidth;
        }, 100);

        const updateCurrentTime = () => {
            const time = new Date();
            let minute = time.getMinutes();
            let hour = time.getHours();
            const inMinutes = (hour - this.currentWorkSchedule.from) * 60 + minute;
            minute = `00${minute}`.substr(-2);
            hour = `00${hour}`.substr(-2);

            this.currentTime = `${hour}:${minute}`;
            this.currentTimeLeft = inMinutes * this.minuteWidth + this.subjectWidth;
            this.currentTimeInMinutes = inMinutes;
        }

        updateCurrentTime();
        window.setInterval(() => updateCurrentTime(), 60 * 1000);

        bus.$on('calendar::clear-today', () => this.clearToday());
        bus.$on('calendar::clear-between', () => this.clearBetween());
        bus.$on('calendar::bind-new-lessons', () => {
           const unbinded = document.querySelectorAll('.ribbon-item.unbinded')
               .forEach(item => this.bindEventsToLesson(item));
        });
    },
    beforeDestroy() {
        document.removeEventListener('mousemove', this.mouseMove);
        document.removeEventListener('mouseup', this.mouseUp);
        document.removeEventListener('mousedown', this.mouseDown);
    },
    methods: {
        getTeachersAccompanist() {
            const teachers = JSON.parse(this.teachers);
            const teachersAccompanist = teachers.filter(t => t.accompanist === 1);
            return teachersAccompanist || [];
        },
        formatDate(day) {
            if (day === null) {
                return null;
            }

            let date = day.getDate();
            let month = day.getMonth();
            let year = day.getFullYear();

            date = `00${date}`.substr(-2);
            month = `00${month + 1}`.substr(-2);

            return `${date}.${month}.${year}`;
        },
        clearToday() {
            this.lockCalendar = true;

            axios.delete(`${this.clearTodayUrl}?day=${this.currentDayLabel}`)
                .then(response => response.data)
                .then(response => this.loadEvents());
        },
        clearBetween() {
            this.lockCalendar = true;
            this.showClearBetweenPopup();
        },

        showClearBetweenPopup() {
            this.isClearBetweenVisible = true;
            this.isClearBetweenLocked = false;
        },
        closeBetweenPopup() {
            this.isClearBetweenVisible = false;
        },
        toggleCalendar() {
            this.betweenCalendarVisible = !this.betweenCalendarVisible;
        },
        updateRange(value) {
            this.rangeStart = value.start;
            this.rangeEnd = value.end;
        },
        applyBetween() {
            if (this.rangeStart !== null && this.rangeEnd !== null) {
                this.isClearBetweenLocked = true;
                axios.delete(`${this.clearTodayUrl}?range=1&start=${this.formatDate(this.rangeStart)}&end=${this.formatDate(this.rangeEnd)}`)
                    .then(response => response.data)
                    .then(response => this.loadEvents())
                    .then(response => this.closeBetweenPopup())
                ;
            }
        },

        isActiveDay(dayOfWeek) {
            return this.dayOfWeek === dayOfWeek;
        },
        changeDayOfWeek(dayOfWeek) {
            if (dayOfWeek === this.dayOfWeek) {
                return ;
            }

            this.dayOfWeek = dayOfWeek;
            this.loadEvents();
        },
        getWorkSchedule(dayOfWeek) {
            let scheduleElement = this.workSchedule[dayOfWeek];
            if (typeof scheduleElement !== "undefined") {
                return scheduleElement;
            }

            return { until: 0, from: 0 };
        },
        hourWithOffset(hour) {
            let from = Number(this.currentWorkSchedule.from);
            let withOffset = `00${from + hour}`;
            return withOffset.substr(-2);
        },
        loadEvents(day = null) {
            if (day === null) {
                day = this.currentDay;
            }

            let date = day.getDate();
            let month = day.getMonth() + 1;

            date = `00${date}`.substr(-2);
            month = `00${month}`.substr(-2);

            const formatted = `${day.getFullYear()}-${month}-${date}`;

            this.lockCalendar = true;
            axios.get(`${this.scheduleUrl}?date=${formatted}`)
                .then(response => response.data)
                .then(response => {
                    this.events = response;
                    console.log(response);
                })
                .then(() => this.updateLessonEvents())
                .then(() => this.lockCalendar = false)
                .then(() => this.updateWidths())
                .then(() => this.$forceUpdate())
                .catch(() => {
                    this.lockCalendar = false;
                    this.contextTarget = null;
                    this.contextType = 'default';

                })
            ;
        },
        updateLessonsList(day = null) {
            if (day === null) {
                day = this.currentDay;
            }

            let date = day.getDate();
            let month = day.getMonth() + 1;

            date = `00${date}`.substr(-2);
            month = `00${month}`.substr(-2);

            const formatted = `${day.getFullYear()}-${month}-${date}`;
            loadMoreLessons(formatted);
        },
        updateWidths() {
            const calendarBody = this.$el.querySelector('.calendar-body');
            const subject = calendarBody.querySelector('.cell-subject');
            const cell = calendarBody.querySelector('.cell:not(.cell-subject)');
            let subjectWidth = subject.offsetWidth;
            let cellWidth = cell.offsetWidth;

            this.minuteWidth = cellWidth / 15;
            this.subjectWidth = subjectWidth;
            this.currentTimeLeft = this.currentTimeInMinutes * this.minuteWidth + this.subjectWidth;

            this.$el.querySelector('.calendar').scrollLeft = this.currentTimeLeft - this.subjectWidth - 200;
        },
        updateLessonEvents() {
            const events = this.events[this.dayOfWeek];
            this.lessonEvents = {};

            for (let _itemsInAudience of Object.values(events)) {
                for (let _itemsAtHour of Object.values(_itemsInAudience)) {
                    for (let itemsAtMinute of Object.values(_itemsAtHour)) {
                        for (let item of itemsAtMinute) {
                            if (typeof this.lessonEvents[item.lesson_id] === "undefined") {
                                this.lessonEvents[item.lesson_id] = [];
                            }

                            this.lessonEvents[item.lesson_id].push(item);
                            item.minute = item.minute + (item.offset || 0);
                        }
                    }
                }
            }
        },
        bindEventsToLessons() {
            if (!this.isEditable) {
                return ;
            }

            const items = document.querySelectorAll('.ribbon-item');
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                this.bindEventsToLesson(item);
            }
        },
        bindEventsToLesson(item) {
            let timeLeft = item.getAttribute('data-time-left');
            let lessonId = item.getAttribute('data-lesson-id');
            item.classList.remove('unbinded');
            timeLeft = Number(timeLeft);
            lessonId = Number(lessonId);

            this.timeLeft[lessonId] = timeLeft;

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();

                this.dragItem = item;
                this.isDragging = true;

                const previewPlaceholder = this.createPlaceholder(item);

                previewPlaceholder.style.left = `${e.pageX + this.previewOffset}px`;
                previewPlaceholder.style.top = `${e.pageY + this.previewOffset}px`;
                const mySubjectId = Number(this.dragItem.getAttribute('data-subject-id'));
                const myInstrumentId = Number(this.dragItem.getAttribute('data-instrument-id'));
                this.lockWrongAudiences(mySubjectId, myInstrumentId);
            });
        },
        lockWrongAudiences(subjectId, instrumentId = -1) {
            const rows = document.querySelectorAll('[data-subjects]');

            const fieldName = instrumentId < 0 ? 'data-subjects' : 'data-instruments';
            const fieldValue = instrumentId < 0 ? subjectId : instrumentId;

            for (let i = 0; i < rows.length; i++) {
                const subjects = rows[i].getAttribute(fieldName).split(';').map(s => Number(s));
                if (subjects.indexOf(fieldValue) < 0) {
                    rows[i].classList.add('wrong-audience');
                }
            }
        },
        unlockWrongAudiences() {
            const wrongAudiences = document.querySelectorAll('.wrong-audience');
            for (let i = 0; i < wrongAudiences.length; i++) {
                wrongAudiences[i].classList.remove('wrong-audience');
            }
        },
        createPlaceholder(item) {
            const copy = item.cloneNode(true);

            const previewPlaceholder = this.$refs.dragPreviewPlaceholder;

            while (previewPlaceholder.firstElementChild !== null) {
                previewPlaceholder.removeChild(previewPlaceholder.firstElementChild);
            }

            previewPlaceholder.appendChild(copy);
            return previewPlaceholder;
        },
        globalMouseMove(e) {
            if (!this.isDragging) {
                return ;
            }

            const previewPlaceholder = this.$refs.dragPreviewPlaceholder;
            previewPlaceholder.style.left = `${e.pageX + this.previewOffset}px`;
            previewPlaceholder.style.top = `${e.pageY + this.previewOffset}px`;

            this.debounceMouseMove(e);
        },
        debouncedMouseMove(e) {
            let x = e.pageX - window.pageXOffset;
            let y = e.pageY - window.pageYOffset;

            const elementUnderCursor = document.elementFromPoint(x, y);
            this.removeHighlighted();

            if (elementUnderCursor !== null && elementUnderCursor.classList.contains('cell')
                && !elementUnderCursor.classList.contains('cell-hour')
                && !elementUnderCursor.classList.contains('cell-subject')
            ) {
                elementUnderCursor.classList.add('highlight');
                this.targetCell = elementUnderCursor;
            } else {
                this.targetCell = null;
            }
        },
        globalMouseDown(e) {
            if (this.isContextVisible) {
                let target = e.target;
                let isOutsideContext = true;
                while (target !== document.body) {
                    target = target.parentElement;
                    if (target === this.$refs.contextMenu) {
                        isOutsideContext = false;
                    }
                }

                if (isOutsideContext) {
                    this.isContextVisible = false;
                    if (this.contextType === 'dayOfWeek') {
                        this.contextType = 'default';
                    }
                }
            }
        },
        globalMouseUp(e) {
            if (e.button !== 0) {
                return ;
            }

            let x = e.pageX - window.pageXOffset;
            let y = e.pageY - window.pageYOffset;
            const isDaySpan = document.elementFromPoint(x, y);

            if (isDaySpan.hasAttribute('data-day-of-week-span')) {
                return ;
            }

            if ((!this.isDragging && this.targetCell === null) || this.isContextVisible) {
                return ;
            }

            if (this.showPopup) {
                return ;
            }

            if (!this.isDragging || this.targetCell === null || !this.targetCell.classList.contains('cell')) {
                this.isDragging = false;
                this.dragItem = null;
                this.unlockWrongAudiences();

                if (this.contextTarget !== null) {
                    this.contextTarget.classList.remove('hidden');
                    if (this.contextTarget.parentElement !== null) {
                        this.contextTarget.parentElement.classList.add('with-event');
                    }
                    this.contextTarget = null;
                }

                return ;
            }

            this.removeHighlighted();

            let hour = this.targetCell.getAttribute('data-hour');
            let minute = this.targetCell.getAttribute('data-minute');
            const audienceId = this.targetCell.getAttribute('data-audience-id');

            hour = Number(hour);
            minute = Number(minute);

            if (this.contextTarget !== null) {
                this.isDragging = false;
                this.dragItem = null;
                this.isContextVisible = true;
                this.contextType = 'move';

                this.newHour = hour;
                this.newMinute = minute;
                this.newAudienceId = audienceId;

                this.$nextTick(() => {
                    this.placeContextAt(e.pageX, e.pageY);
                });
            } else {
                const lessonId = this.dragItem.getAttribute('data-lesson-id');
                this.initMinute(audienceId, hour, minute);

                if (typeof this.lessonEvents[lessonId] === "undefined") {
                    this.lessonEvents[lessonId] = [];
                }

                const lessonJson = this.dragItem.getAttribute('data-lesson');
                const eventJson = this.dragItem.getAttribute('data-event');
                const lesson = JSON.parse(lessonJson ? lessonJson : eventJson);
                const lessonTitle = this.dragItem.querySelector('.lesson-title');
                const instrumentId = Number(this.dragItem.getAttribute('data-instrument-id'));
                const teacherId = lesson.teacher_id;
                const teacherAccompanistId = lesson.teacher_accompanist_id;
                const totalDuration = lesson.duration_left;
                const dayOfWeek = this.dayOfWeek;
                const currentDay = this.currentDay;
                let day = currentDay.getDate();
                let month = currentDay.getMonth() + 1;

                day = `00${day}`.substr(-2);
                month = `00${month}`.substr(-2);

                const currentTimeLeft = this.timeLeft[Number(lessonId)];

                const fireAt = `${day}.${month}.${currentDay.getFullYear()}`;
                let title = '';
                let oneTime = false;
                let type = '';
                if (eventJson) {
                    title = lessonTitle !== null ? lessonTitle.innerText : lesson.name;
                    if (lesson.type === 'one-time') {
                        oneTime = true;
                        type = 'one-time';
                    } else {
                        oneTime = false;
                        type = 'repeat';
                    }
                } else {
                    title = lessonTitle !== null ? lessonTitle.innerText : `Заняття №${lesson.id}`;
                }
                let event = {
                    size: 'one-hour',
                    title: title,
                    eventType: type,
                    type: 1,
                    duration: 45 > currentTimeLeft ? currentTimeLeft : 45,
                    relatedTo: this.dragItem,
                    onetime: oneTime,
                    audience_id: audienceId,
                    lesson_id: lessonId,
                    event_id: lesson.id,
                    teacher_id: teacherId,
                    teacher_accompanist_id: teacherAccompanistId,
                    accompanist: lesson.accompanist,
                    hour, minute, totalDuration, dayOfWeek, fireAt, instrumentId
                };
                //
                this.currentEvent = event;
                this.showPopup = true;
                this.isDragging = false;
                this.dragItem = null;
            }
        },
        initMinute(audienceId, hour, minute) {
            if (typeof this.events[this.dayOfWeek] === "undefined") {
                this.events[this.dayOfWeek] = {};
            }
            if (typeof this.events[this.dayOfWeek][audienceId] === "undefined") {
                this.events[this.dayOfWeek][audienceId] = {};
            }
            if (typeof this.events[this.dayOfWeek][audienceId][hour] === "undefined") {
                this.events[this.dayOfWeek][audienceId][hour] = {};
            }
            if (typeof this.events[this.dayOfWeek][audienceId][hour][minute] === "undefined") {
                this.events[this.dayOfWeek][audienceId][hour][minute] = [];
            }
        },
        removeHighlighted() {
            const highlighted = document.querySelector('.cell.highlight');
            if (highlighted !== null) {
                highlighted.classList.remove('highlight');
            }
        },
        getEventsFor(audienceId, hour, minute) {
            if (!this.hasEventsAt(audienceId, hour, minute)) {
                return [];
            }

            return this.events[this.dayOfWeek][audienceId][hour][minute].filter(event => {
                return this.applyFilter('teachers', event.teacher_id)
                    && this.applyFilter('groups', event.group_id)
                    && this.applyFilter('subgroups', event.subgroup_id)
                    && this.applyFilter('subject_types', event.subject_type)
                    && this.applyFilter('students', event.student_id);
            });
        },
        hasEventsAt(audienceId, hour, minute) {
            return !(typeof this.events[this.dayOfWeek] === "undefined"
                || typeof this.events[this.dayOfWeek][audienceId] === "undefined"
                || typeof this.events[this.dayOfWeek][audienceId][hour] === "undefined"
                || typeof this.events[this.dayOfWeek][audienceId][hour][minute] === "undefined");
        },
        getEventWidth(event) {
            const width = event.duration * this.minuteWidth;
            return `${width}px`;
        },
        getOffsetInPx(event) {
            return `${event.offset * this.minuteWidth}px`;
        },
        getEventZIndex(event) {
            return this.eventHover === event.id ? 108 : null;
        },
        getLessonStyles(index) {
            const isLastRows = index > this.filteredAudiences().length - 4 && index > 3;
            if (!isLastRows) {
                return {};
            }

            return {
                top: '-100%',
                marginTop: '-60px'
            };
        },
        getSubjectType(type) {
            switch(type) {
                case 'group': return 'Групповой';
                case 'individual': return 'Индивидуальный';
                default: return '';
            }
        },
        getElementOffset(el) {
          const rect = el.getBoundingClientRect(),
              scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
              scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
        },
        highlightEvent(event) {
            this.eventHover = event.id;
            this.highlightedEvent = event;
            const el = document.querySelector(`#event-${event.id}`);
            const bbox = el.getBoundingClientRect();
            let elementOffset = this.getElementOffset(el);
            elementOffset.height = bbox.height;

            this.highlightedOffset = elementOffset;
        },
        removeEventHighlight() {
            this.eventHover = 0;
            this.highlightedEvent = null;
        },
        handleContext(e, targetEvent, hour, minute, audienceId) {
            if (typeof targetEvent.id === "undefined" || !this.isEditable) {
                return ;
            }

            this.moveToOtherDayFrom = null;

            let x = e.pageX - window.pageXOffset;
            let y = e.pageY - window.pageYOffset;

            let elementUnderCursor = document.elementFromPoint(x, y);

            if (elementUnderCursor.tagName !== "DIV") {
                elementUnderCursor = elementUnderCursor.parentElement;
            }

            this.contextTarget = elementUnderCursor;

            this.isContextVisible = true;
            this.placeContextAt(e.pageX, e.pageY);

            this.currentEvent = targetEvent;
            this.contextForAudience = audienceId;
            this.contextForHour = hour;
            this.contextForMinute = minute;
        },
        placeContextAt(x, y) {
            this.$nextTick(() => {
                const contextMenu = this.$refs.contextMenu;

                if (typeof contextMenu === "undefined") {
                    return ;
                }

                contextMenu.style.top = `${y}px`;
                contextMenu.style.left = `${x}px`;
            });
        },

        // Popup actions
        discardEvent() {
            this.showPopup = false;
            this.currentEvent = null;
            this.lockCalendar = false;
            this.errors = [];

            this.unlockWrongAudiences();

            if (this.popupMode === 'edit') {
                this.popupMode = 'default';
                this.contextTarget = null;
            }
        },
        toggleOnetime() {
            this.currentEvent.onetime = !this.currentEvent.onetime;
        },
        updateHour(hour) {
            this.currentEvent.hour = hour - this.currentWorkSchedule.from;
        },
        updateMinute(minute) {
            this.currentEvent.minute = minute;
        },
        applyEvent() {
            const event = this.currentEvent;
            const {audience_id, hour, minute, lesson_id} = event;

            const realMinute = this.getSegmentByMinute(event.minute);
            const offset = event.minute - realMinute;

            event.minute = realMinute;
            event.offset = offset;

            this.initMinute(audience_id, hour, realMinute);

            const targetEvents = this.events[this.dayOfWeek][audience_id][hour][realMinute];
            const targetLessons = this.lessonEvents[lesson_id];

            if (this.popupMode === 'default' || typeof event.id === "undefined") {
                this.placeEvent(event, targetEvents, targetLessons);
            } else {
                this.updateEvent(event);
            }

            event.minute = event.minute + event.offset;
        },


        placeEvent(event, targetEvents, targetLessons) {
            this.lockPopup = true;
            this.lockCalendar = true;
            this.errors = [];
            let url;
            if (event.eventType === 'one-time') {
                url = this.placeSingleEventUrl;
            } else if (event.eventType === 'repeat') {
                url = this.placeRepeatEventUrl;
            }
            else {
                url = this.placeEventUrl;
            }
            axios.post(url, {
                ...event,
                audienceId: event.audience_id,
                lessonId: event.lesson_id ? event.lesson_id : event.event_id,
                teacherId: event.teacher_id
            })
                .then(response => response.data)
                .then(response => {
                    console.log(response);
                    event.id = response.id;
                    event.lesson_id = response.lesson_id;
                    event.eventType = response.event_type ? response.event_type : response.type;
                    event.event_id = response.event_id;
                    event.student_id = response.student_id;
                    event.teacher_id = response.teacher_id;
                    event.group_id = response.group_id;
                    event.subgroup_id = response.subgroup_id;
                    event.subject_name = response.subject_name;
                    event.subject_type = response.subject_type;
                    event.subject_id = response.subject_id;
                    event.audience_id = response.audience_id;
                    event.offset = response.offset;
                    this.updateLessonsList();

                    this.lockPopup = false;

                    // this.currentEvent.teacher_id = null;
                    this.showPopup = false;
                    this.currentEvent = null;
                    this.lockCalendar = false;

                    targetEvents.push(event);
                    targetLessons.push(event);

                    this.popupMode = 'default';
                    this.contextTarget = null;

                    this.unlockWrongAudiences();
                })
                .then(() => this.$forceUpdate())
                .catch(e => {
                    if (e.response) {
                        const {errors} = e.response.data;
                        console.log(errors);
                        this.errors = [];
                        for (let key in errors) {
                            for (let error of errors[key]) {
                                this.errors.push(error);
                            }
                        }
                    }
                    this.lockPopup = false;
                    this.contextTarget = null;
                    this.contextType = 'default';
                    // this.$forceUpdate();
                });
        },
        updateEvent(event) {
            const { hour, minute, offset, teacher_id, teacher_accompanist_id, duration, onetime, initial_minute, initial_hour } = event;
            const update = { hour, minute, offset, teacher_id, duration, onetime, teacher_accompanist_id };
            const dayOfWeek = this.dayOfWeek;

            const initialSegment = this.getSegmentByMinute(initial_minute);
            const newSegment = this.getSegmentByMinute(minute);
            const events = this.getEventsFor(event.audience_id, initial_hour, initialSegment);

            axios.patch(`${this.updateEventUrl}?event_id=${this.currentEvent.id}&day_of_week=${dayOfWeek}`, update)
                .then(response => response.data)
                .then(response => {
                    const lessonId = response.lesson.id;
                    const timeLeft = response.lesson.duration_left;
                    this.timeLeft[lessonId] = Number(timeLeft);

                    this.events[this.dayOfWeek]
                        [event.audience_id][initial_hour][initialSegment].splice(events.indexOf(event), 1);


                    this.initMinute(event.audience_id, hour, newSegment);

                    this.events[this.dayOfWeek][event.audience_id][event.hour][newSegment].push(event);

                    this.updateLesson(response.html);

                    this.popupMode = 'default';
                    this.contextTarget = null;

                    return response.event;
                })
                .then(response => {
                    this.currentEvent.onetime = onetime;
                    this.currentEvent.teacher_id = teacher_id;
                })
                .then(() => this.showPopup = false)
                .then(() => this.currentEvent = null)
                .catch(e => {
                    if (e.response) {
                        const {errors} = e.response.data;

                        this.errors = [];
                        for (let key in errors) {
                            for (let error of errors[key]) {
                                this.errors.push(error);
                            }
                        }
                    }

                    this.lockPopup = false;
                    this.$forceUpdate();
                });
        },
        updateTeacher(teacherId) {
            this.currentEvent.teacher_id = teacherId;
        },
        updateTeacherAccompanist(teacherId) {
            this.currentEvent.teacher_accompanist_id = teacherId;
        },

        // Actions:
        removeSingleEvent() {
            this.removeEvent();
        },
        removeEvent(withMoves = true, byLesson = false, deleteAll = false) {
            if (!this.hasEventsAt(this.contextForAudience, this.contextForHour, this.contextForMinute)) {
                return ;
            }

            if (this.currentEvent.type === 2 || this.isPastEvent(this.currentEvent)) {
                return ;
            }

            if (this.currentEvent.onetime) {
                this.currentEvent.type = 2;
            }

            // this.removeFromEvents(this.contextForAudience, this.contextForHour, this.contextForMinute, this.currentEvent);

            const events = this.events[this.dayOfWeek]
                [this.contextForAudience]
                [this.contextForHour]
                [this.contextForMinute];

            const eventIndex = events.indexOf(this.currentEvent);
            this.lockCalendar = true;
            axios.delete(`${this.deleteEventUrl}?event_id=${this.currentEvent.id}&with_moved=${withMoves}&deleteAll=${deleteAll}`)
                .then(response => response.data)
                .then(response => {
                    const lessonId = response.lesson.id;
                    const timeLeft = response.lesson.duration_left;
                    this.timeLeft[lessonId] = Number(timeLeft);

                    if (response.is_future) {
                        if (!this.currentEvent.onetime || response.original_id !== null) {
                            events.splice(eventIndex, 1);
                        }
                    }

                    return response.html;
                })
                .then(response => {
                    // this.updateLesson(response);
                    this.updateLessonsList();
                    this.contextTarget = null;
                })
                .then(() => this.lockCalendar = false)
                .then(() => this.$forceUpdate())
                .catch(() => {
                    this.lockCalendar = false;
                    this.contextTarget = null;
                    this.contextType = 'default';
                })
            ;

            this.isContextVisible = false;
        },
        addSingleLesson(lessonHTMLCode) {
            let _block = document.createElement('div');
            _block.innerHTML = lessonHTMLCode;
            _block = _block.firstElementChild;
            const ribbonItems = document.querySelector('.ribbon-items');
            const spacer = ribbonItems.lastElementChild;
            ribbonItems.insertBefore(_block, spacer);

            this.bindEventsToLesson(_block);
        },
        updateLesson(lessonHTMLCode) {
            let _block = document.createElement('div');
            _block.innerHTML = lessonHTMLCode;
            _block = _block.firstElementChild;
            const lessonId = _block.getAttribute('data-lesson-id');
            let lessonBlock = document.querySelector(`.lessons-ribbon [data-lesson-id="${lessonId}"]`);
            let duration = Number(_block.querySelector('.lesson-duration').innerText);
            const eventId = _block.getAttribute('data-event-id');
            const eventType = _block.getAttribute('data-type');
            const ribbonItems = document.querySelector('.ribbon-items');
            const spacer = ribbonItems.lastElementChild;
            if (eventId && eventType == 'one-time') {
                lessonBlock = document.querySelector(`.lessons-ribbon [data-event-id="${eventId}"]`);
                duration = 1;
            }
            if (duration > 0) {
                if (lessonBlock !== null) {
                    const lessonDurationSpan = lessonBlock.querySelector('.lesson-duration');
                    lessonDurationSpan.innerText = _block.querySelector('.lesson-duration').innerText;
                } else {
                    ribbonItems.insertBefore(_block, spacer);
                    this.bindEventsToLesson(_block);
                    bus.$emit('$ribbon::add-to-ignore', lessonId);
                }
            } else {
                if (lessonBlock !== null) {
                    lessonBlock.parentElement.removeChild(lessonBlock);
                    bus.$emit('$ribbon::load-one');
                }
                this.timeLeft[Number(lessonId)] = 0;
            }
        },
        removeEventOnlyToday() {
            // if (this.currentEvent.onetime) {
            //     return ;
            // }

            if (this.currentEvent.type === 2 || this.isPastEvent(this.currentEvent)) {
                return ;
            }

            this.lockCalendar = true;
            const formatted = this.currentDayLabel;

            const events = this.events[this.dayOfWeek]
                [this.contextForAudience]
                [this.contextForHour]
                [this.contextForMinute];

            const eventIndex = events.indexOf(this.currentEvent);
            this.currentEvent.type = 2;

            axios.post(`${this.skipAtUrl}?event_id=${this.currentEvent.id}&day=${formatted}`)
                .then(response => response.data)
                .then(response => {
                    const event = response.event;
                    this.currentEvent.id = event.id;

                    return response.html;
                })
                // .then(response => this.updateLesson(response))
                .then(() => {
                    if (this.currentEvent.type !== 2) {
                        events.splice(eventIndex, 1);
                    }
                    this.updateLessonsList();
                })
                .then(() => this.lockCalendar = false)
                .then(() => this.contextTarget = null)
                .then(() => this.$forceUpdate())
                .catch((err) => console.log(err))
            ;

            this.isContextVisible = false;
        },
        removeFullEventOnlyToday() {
            // if past event or
            if (this.currentEvent.type === 2 || this.isPastEvent(this.currentEvent)) {
                return ;
            }

            this.lockCalendar = true;
            const formatted = this.currentDayLabel;

            const events = this.events[this.dayOfWeek]
                [this.contextForAudience]
                [this.contextForHour]
                [this.contextForMinute];

            const eventIndex = events.indexOf(this.currentEvent);
            this.currentEvent.type = 2;
            axios.delete(`${this.deleteEventUrl}?event_id=${this.currentEvent.id}&with_moved=true`)
                .then(response => response.data)
                .then(response => {
                    // const event = response.event;
                    // this.currentEvent.id = event.id;

                    //return response.html;
                })
                //.then(response => this.updateLesson(response))
                .then(() => {
                    if (this.currentEvent.type !== 2) {
                        events.splice(eventIndex, 1);
                    }
                    this.updateLessonsList();
                })
                .then(() => this.lockCalendar = false)
                .then(() => this.contextTarget = null)
                .then(() => this.$forceUpdate())
                .catch((err) => console.log(err))
            ;

            this.isContextVisible = false;
        },
        reactivate() {
            if (this.isPastEvent(this.currentEvent)) {
                return ;
            }

            this.lockCalendar = true;
            this.isContextVisible = false;
            this.contextTarget = null;
            axios.get(`${this.reactivateUrl}?event_id=${this.currentEvent.id}`)
                .then(response => response.data)
                .then(response => {
                    this.currentEvent.type = response.type;
                    this.lockCalendar = false;
                })
                .catch(() => {
                    this.lockCalendar = false;
                    this.contextTarget = null;
                    this.contextType = 'default';
                })
            ;
        },
        removeEventAfter() {
            if (this.currentEvent.onetime) {
                return ;
            }

            if (this.currentEvent.type === 2) {
                return ;
            }

            this.lockCalendar = true;
            const formatted = this.currentDayLabel;

            const events = this.events[this.dayOfWeek]
                [this.contextForAudience]
                [this.contextForHour]
                [this.contextForMinute];

            const eventIndex = events.indexOf(this.currentEvent);

            axios.post(`${this.skipAfterUrl}?event_id=${this.currentEvent.id}&day=${formatted}`)
                .then(response => response.data)
                //.then(response => this.updateLesson(response))
                .then(response => events.splice(eventIndex))
                .then(() => {
                    this.updateLessonsList();
                })
                .then(() => this.lockCalendar = false)
                .then(() => this.contextTarget = null)
                .then(() => this.$forceUpdate());

            this.isContextVisible = false;
        },

        /// Edit event:
        editEvent() {
            if (this.currentEvent.type === 2 || this.isPastEvent(this.currentEvent)) {
                return ;
            }

            this.isContextVisible = false;
            this.showPopup = true;
            this.lockPopup = false;
            this.popupMode = 'edit';

            this.currentEvent.initial_duration = this.currentEvent.duration;
            this.$set(this.currentEvent, 'initial_duration', this.currentEvent.duration);
            this.$set(this, 'initialDuration', this.currentEvent.duration);
            this.$set(this.currentEvent, 'initial_minute', this.currentEvent.minute);
            this.$set(this, 'initialMinute', this.currentEvent.minute);
            this.$set(this.currentEvent, 'initial_hour', this.currentEvent.hour);
            this.$set(this, 'initialHour', this.currentEvent.hour);
        },

        /// Move event:
        moveEvent() {
            if (this.isPastEvent(this.currentEvent)) {
                return ;
            }
            this.isContextVisible = false;
            let ribbonItem = this.contextTarget.querySelector('.ribbon-item');
            this.contextTarget.classList.add('hidden');
            this.contextTarget.parentElement.classList.remove('with-event');

            const placeholder = this.createPlaceholder(ribbonItem);
            this.isDragging = true;
            this.dragItem = this.contextTarget;

            const mySubjectId = this.currentEvent.subject_id;
            const myInstrumentId = this.currentEvent.instrumentId;
            if (this.currentEvent.type !== 2) {
                this.lockWrongAudiences(mySubjectId, myInstrumentId);
            }
        },
        moveToOtherDay() {
            if (this.isPastEvent(this.currentEvent)) {
                return ;
            }

            this.contextType = 'dayOfWeek';
        },
        changeDayOfWeekAndMove(dayOfWeek) {
            const moveFrom = new Date();
            moveFrom.setFullYear(this.startOfWeekDay.getFullYear());
            moveFrom.setMonth(this.startOfWeekDay.getMonth());
            moveFrom.setDate(this.startOfWeekDay.getDate() + this.dayOfWeek);
            this.moveToOtherDayFrom = moveFrom;
            this.moveEvent();
            this.changeDayOfWeek(dayOfWeek);
        },
        cancelMoveDayOfWeek() {
            this.contextType = 'default';
        },
        moveEventAt() {
            this.moveEventTo(true);
        },
        moveEventAfter() {
            if (this.currentEvent.onetime) {
                return ;
            }

            this.moveEventTo(false);
        },
        moveCancel() {
            if (this.contextTarget !== null && (
                this.contextTarget.parentElement !== null
                && typeof this.contextTarget.parentElement !== "undefined"
            )) {
                this.contextTarget.classList.remove('hidden');
                this.contextTarget.parentElement.classList.add('with-event');
            }

            this.contextTarget = null;
            this.contextType = 'default';
            this.isContextVisible = false;
            this.isDragging = false;
            this.dragItem = null;

            this.unlockWrongAudiences();
        },
        moveEventTo(isOnetime) {
            this.contextType = 'default';
            this.isContextVisible = false;

            const {newAudienceId: audienceId, newHour: hour, newMinute: minute, currentEvent: event, dayOfWeek} = this;

            this.contextTarget.classList.add('lock-loading');
            this.lockCalendar = true;

            this.isDragging = false;
            this.dragItem = null;
            this.unlockWrongAudiences();

            this.currentEvent.offset = 0;
            let fromDay = null;

            if (this.moveToOtherDayFrom !== null) {
                let date = this.moveToOtherDayFrom.getDate();
                let month = this.moveToOtherDayFrom.getMonth();

                date = `00${date}`.substr(-2);
                month = `00${month + 1}`.substr(-2);

                fromDay = `${date}.${month}.${this.moveToOtherDayFrom.getFullYear()}`;
            }
            console.log(this.currentEvent);
            axios.post(`${this.moveEventUrl}?event_id=${event.id}${fromDay !== null ? '&from_date=' + fromDay : ''}`, {
                audienceId, hour, minute, dayOfWeek, onetime: isOnetime, day: this.currentDayLabel
            })
                .then(response => response.data)
                .then(response => {
                    event.id = response.id;
                    event.onetime = response.onetime;
                })
                .then(() => this.lockCalendar = false)
                .then(() => this.move(audienceId, hour, minute, event))
                .then(() => this.$forceUpdate())
                .catch((err) => {
                    if (err.response) {
                        const {errors} = err.response.data;
                        this.errors = [];
                        for (let key in errors) {
                            for (let error of errors[key]) {
                                this.errors.push(error);
                                alert(error);
                            }
                        }
                    }
                    // this.lockPopup = false;
                    // this.contextTarget = null;
                    // this.contextType = 'default';
                    // this.$forceUpdate();

                    this.events = [];
                    this.lockCalendar = false;
                    this.contextTarget = null;
                    this.contextType = 'default';

                    // const targetEvents = this.currentEvent[this.dayOfWeek][this.currentEvent.audience_id][hour][minute];
                    // console.log(targetEvents);
                    // const targetLessons = this.lessonEvents[lesson_id];

                    // if (this.popupMode === 'default' || typeof event.id === "undefined") {
                    //     this.placeEvent(event, targetEvents, targetLessons);
                    // } else {
                    //     this.updateEvent(event);
                    // }

                    this.loadEvents();
                    // this.$forceUpdate();

                });
        },
        move(audienceId, hour, minute, event) {
            const offset = Number(this.currentWorkSchedule.from) || 0;
            const segment = this.getSegmentByMinute(event.minute);

            if (this.hasEventsAt(event.audience_id, event.hour, segment)) {
                let eventIndex = this.events[this.dayOfWeek][event.audience_id][event.hour][segment];
                eventIndex = eventIndex.map(e => e.id).indexOf(event.id);
                this.events[this.dayOfWeek][event.audience_id][event.hour][segment].splice(eventIndex, 1);
            }

            if (!this.hasEventsAt(audienceId, hour, minute)) {
                this.initMinute(audienceId, hour, minute);
            }

            event.audience_id = audienceId;
            event.hour = hour;
            event.minute = minute;

            this.events[this.dayOfWeek][audienceId][hour][minute].push(event);
        },

        updateDuration(value) {
            this.currentEvent.duration = Number(value);
        },
        nextWeek() {
            this.changeDay(7);
        },
        prevWeek() {
            this.changeDay(-7);
        },
        setToday() {
            this.scheduleDay = new Date();
            this.updateDate();
        },
        prevDay() {
            this.scheduleDay.setDate(this.scheduleDay.getDate() - 1);
            this.updateDate();
        },
        nextDay() {
            this.scheduleDay.setDate(this.scheduleDay.getDate() + 1);
            this.updateDate();
        },
        updateDate() {
            this.dayOfWeek = this.scheduleDay.getDay();
            this.dayOfWeek--;
            if (this.dayOfWeek < 0) {
                this.dayOfWeek = 6;
            }

            this.loadEvents(this.scheduleDay);
        },
        changeDay(delta) {
            const tempStart = new Date(this.startOfWeekDay);
            const tempEnd = new Date(this.endOfWeekDay);

            tempStart.setDate(tempStart.getDate() + delta);
            tempEnd.setDate(tempEnd.getDate() + delta);

            this.startOfWeekDay = tempStart;
            this.endOfWeekDay = tempEnd;

            this.updateSchedule();
        },
        closeCalendarPopup() {
            this.isShowWeekPopup = false;
        },
        updateWeek(value) {
            value = value.split('-');

            const daysInMonth = new Date(value[0], value[1] - 1, 0);

            this.startOfWeekDay = new Date(value[0], value[1] - 1, value[2]);
            this.endOfWeekDay = new Date(value[0], value[1] - 1, Number(value[2]) + 6);

            if (this.endOfWeekDay.getDate() > daysInMonth) {
                const delta = this.endOfWeekDay.getDate() - daysInMonth;
            }

            this.updateSchedule();
        },
        updateSchedule() {
            this.loadEvents();
            this.updateLessonsList();
        },
        toggleWeekPopup() {
            const {isShowWeekPopup} = this;
            this.isShowWeekPopup = !isShowWeekPopup;
        },
        getSegmentByMinute(minute) {
            if (minute >= 0 && minute <= 14) {
                return 0;
            } else if (minute >= 15 && minute <= 29) {
                return 15;
            } else if (minute >= 30 && minute <= 44) {
                return 30;
            } else if (minute >= 45 && minute <= 59) {
                return 45;
            }
        },

        /// Filters
        updateFilter(filter, value) {
            this.$set(this.filters, filter, value);
            // this.filters[filter] = value;

            if (filter === 'audiences') {
                if (typeof window.ribbon !== "undefined") {
                    this.$nextTick(() => window.ribbon.pullToBottom());
                }
            }
        },
        isShowAudience(audience) {
            if (typeof this.filters.audiences === "undefined" || this.filters.audiences.length < 1) {
                return true;
            }

            return this.filters.audiences.map(item => item.id).indexOf(audience.id) > -1;
        },
        filteredAudiences() {
            return this.audiences.filter(audience => this.isShowAudience(audience));
        },
        applyFilter(filter, value) {
            if (typeof this.filters[filter] === "undefined" || this.filters[filter].length < 1 || value === null) {
                return true;
            }
            return this.filters[filter].map(t => t.id).indexOf(value) > -1;
        },


        /// UI:
        dateFor(dayOfWeek) {
            const day = new Date(this.startOfWeekDay);
            day.setDate(day.getDate() + dayOfWeek);
            const date = `00${day.getDate()}`.substr(-2);
            const month = `00${day.getMonth() + 1}`.substr(-2);

            return `${date}.${month}`;
        },
        isPastEvent(event) {
            if (event === null) {
                return ;
            }

            let eventDate = new Date(this.currentDay);
            let fireAtDate = new Date(event.fire_at);
            eventDate.setHours(fireAtDate.getHours());
            eventDate.setMinutes(fireAtDate.getMinutes() + event.offset);

            return eventDate < new Date();
        }
    }
}
</script>

<style scoped>

</style>
