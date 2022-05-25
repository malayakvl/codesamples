<template>
    <div class="plan-list top-20">
        <div
            class="block-light-blue"
            v-show="!showUnconnected || showUnconnected && item.connectedId || showUnconnected && !lessonSelected"
            v-bind:class="{ active:item.id === planSelected, connected: item.connectedId && lessonSelected }"
            v-for="item in items" v-bind:id="`plan-${item.id}`">
                <div class="full-head-plan" @click="selectPlan(item.id)">
                    <span class="title">{{item.title}}</span>
                    <span class="subject-name">{{item.subjectName}}</span>
                </div>
                <div class="row g-0" v-if="item.id === planSelected && lessonId && item.connectedId">
                    <div class="block-lesson col-12">
                        <div class="date">
                            {{ getDay(event.fire_at) }}
                            <em>{{ getMonthYear(event.fire_at) }}</em>
                        </div>
                        <div class="name">
                            {{event.title}}
                            <em>{{ getInterval(event.fire_at, event.duration) }}</em>
                        </div>
                        <div class="action" v-if="item.connectedId && lessonSelected || (isEventConnected === item.id && planSelected)">
                            <a href="javascript:;" @click="removeConnectedPlan(item.id)" title="Видалити"><i class="fas fa-unlink"></i></a>
                            <a href="javascript:;" @click="copyConnectedPlan(item.id)" title="Копіювати"><i class="far fa-copy"></i></a>
                        </div>
                    </div>
                </div>

                <ToDoItem
                    :showUnconnected="showUnconnected"
                    v-bind:visible="false"
                    :item="item"
                    :event="event"
                    :isClicked="item.id === planSelected"
                    :planId="planSelected"
                    :lessonId="lessonId"
                    :subjectId="subjectId"
                    :addCommentUrl="addCommentUrl"
                    :getCommentsUrl="getCommentsUrl"
                    :addHomeFilesUrl="addHomeFilesUrl"
                    :lessonPlanUrl="lessonPlanUrl"
                    :fileRemoveUrl="fileRemoveUrl"
                    :deleteInfoUrl="deleteInfoUrl"
                    :deleteCommentUrl="deleteCommentUrl"

                    @plan-added="doneConnect"

                    ref="myLineChart"
                />

            <popup is-form="false"
                   title="Копіювати"
                   v-bind:visible="showPopup"
                   id="copyInfo"
                   v-bind:modal="true"
                   v-if="showPopup"
                   managed="true"
                   @close="discardCopy()"
                   @apply="copy()"
                   class="copy-popup"
                   :is-apply-locked="applyLocked"
            >
                <div>
                    <div class="row">
                        <div class="col-12">
                            <date-picker v-model="eventDate" valueType="format" @change="changePeriod" />
                        </div>
                    </div>
                    <perfect-scrollbar class="lessons-block popup-events">
                        <div class="dashboard-card  filter-group filter-lesson">
                            <div class="block-lesson"
                                 v-for="event in events"
                                 v-bind:id="`event-${event.id}`"
                                 @click="selectLesson(event)"
                                 v-bind:class="{active:event.id == eventSelected}"
                            >
                                <div class="date">
                                    {{ getDay(event.fire_at) }}
                                    <em>{{ getMonthYear(event.fire_at) }}</em>
                                </div>
                                <div class="name">
                                    {{event.title}}
                                    <em>{{ event.subjectName}}</em>
                                    <em>{{ getInterval(event.fire_at, event.duration) }}</em>
                                </div>
                                <div class="student">{{ event.teacherName}}</div>
                            </div>
                        </div>
                    </perfect-scrollbar>
                </div>
            </popup>
        </div>
    </div>

</template>

<script>
import ToDoItem from "./ToDoItem";
import moment from "moment";
import DatePicker from 'vue2-datepicker';
import { PerfectScrollbar } from 'vue2-perfect-scrollbar'

export default {
    name: 'ToDoList',
    components: {
        ToDoItem,
        DatePicker,
        PerfectScrollbar,
    },
    props:[
        'items',
        'event',
        'lessonId',
        'subjectId',
        'showUnconnected',

        'addCommentUrl',
        'getCommentsUrl',
        'addHomeFilesUrl',
        'lessonPlanUrl',
        'fileRemoveUrl',
        'deleteInfoUrl',
        'schedulePlanUrl',
        'copyInfoUrl',
        'deleteCommentUrl'
    ],
    data() {
        return {
            planSelected: null,
            lessonSelected: null,
            showDetail: {},
            showPopup:false,
            eventDate: moment().format('YYYY-MM-DD'),
            events: [],
            eventSelected: '',
            isEventConnected: '',
            applyLocked: false
        }
    },
    watch: {
        lessonId: function (oldLesonId, newLessonId) {
            this.planSelected = '';
            this.lessonSelected = this.lessonId;
        }
    },
    methods: {
        doneConnect(data) {
            this.planSelected = '';
            // this.isEventConnected = data.item.plan.curriculum_id;
            this.$emit('plan-reload', {
                item: 'reload plan'
            });
        },
        getFormat(date) {
            return moment(date).format('YYYY-MM-DD');
        },
        getDay(date) {
            return moment(date).format('DD');
        },
        getMonthYear(date) {
            return moment(date).locale('uk').format('MMM, Y');
        },
        getInterval(timeFrom, duration) {
            return `
                ${moment(timeFrom).format('HH:mm')} -
                ${moment(timeFrom).add(duration, 'minutes').format('HH:mm')}`;
        },
        removeConnectedPlan(id) {
            this.$confirm("Ви впевнені що хотите видалити?").then((e) => {
                if (e) {
                    document.body.classList.add('lock-loading');
                    axios.delete(`${this.deleteInfoUrl}?lessonId=${this.lessonId}&planId=${this.planSelected}&subjectId=${this.subjectId}`)
                        .then(response => response.data)
                        .then(response => {
                            this.planSelected = '';
                            this.lessonSelected = '';
                            document.body.classList.remove('lock-loading');
                            this.doneConnect(
                                {
                                    data: null
                                }
                            )
                        })
                        .catch((e) => {
                            console.log('error', e);
                            document.body.classList.remove('lock-loading');
                        })
                    ;
                }
            }).catch(function(e){

            });
        },
        selectPlan(id) {
            // document.body.classList.add('lock-loading');
            if (id != this.planSelected) {
                this.planSelected = id;
                // this.$refs.myLineChart.test()
            } else {
                this.planSelected = '';
            }
        },
        discardCopy() {
            this.showPopup = false;
        },
        changePeriod() {
            const date = this.eventDate;
            document.body.classList.add('lock-loading');
            let url = this.schedulePlanUrl;
            document.body.classList.add('lock-loading');
            axios.get(
                `${this.schedulePlanUrl}?dateFrom=${date}&dateTo=${date}&subjectId=${this.subjectId}&currentLessonId=${this.lessonSelected}`
            )
                .then(response => response.data)
                .then(response => {
                    this.events = response.events;

                    if (response.events.length === 0) {
                        this.applyLocked = true;
                    } else {
                        this.applyLocked = false;
                    }
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        selectLesson(event) {
            this.eventSelected = event.id;
        },
        copy() {
            axios.post(
                `${this.copyInfoUrl}?eventToId=${this.eventSelected}&eventFromId=${this.lessonId}`
            )
                .then(response => response.data)
                .then(response => {
                    this.showPopup = false;
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        copyConnectedPlan(planId) {
            this.changePeriod();
            this.showPopup = true;
        }
    }
};
</script>
