<template>
    <div class="plan-list top-20">
        <div
            class=""
            v-for="(item, index) in items" v-bind:id="`plan-${item.id}`">
            <div class="row g-0" v-bind:hidden="hideParents[item.parentEventId]">
                <div
                    class="col-10 block-light-blue"
                    v-bind:class="{ 'current-connected-plan':item.parentEventId === event.id }"
                >
                    <div class="full-head-plan" @click="selectPlan(item.id, item.parentEventId)">
                        <span class="title">#{{ getNumber(index) }} {{item.title}}</span>
                        <span class="subject-name">
                            {{ getDay(item.fire_at) }} {{ getMonthYear(item.fire_at) }}, {{ getWeek(item.fire_at) }} {{ getTime(item.fire_at) }}
                        </span>
                    </div>
                </div>
                <div class="col-2">
                    <div class="float-end done"><i class="fas fa-check-square" v-bind:class="item.is_done ? 'green' : 'gray'"></i></div>
                    <div class="rate-student" v-if="item.rate > 0"><em class="badge">{{ item.rate }}</em></div>
                    <div class="rate-student" v-if="item.is_absent === 1"><em class="badge absent">x</em></div>
                </div>
            </div>

            <div class="row g-0 block-lesson-view" v-if="lessonSelected == item.parentEventId && planSelected">
                <div class="col-10">
                    #{{ getNumber(index) }}  <a href="javascript:;" class="close-plan" @click="unselectPlan(item.id, item.parentEventId)">{{item.title}}</a>
                </div>
                <div class="col-2">
                    <span class="float-end">
                        {{ getDay(item.fire_at) }} {{ getMonthYear(item.fire_at) }}, {{ getWeek(item.fire_at) }} {{ getTime(item.fire_at) }}
                    </span>
                </div>
                <ToDoItem
                    v-if="item.id === planSelected && lessonId"
                    v-bind:visible="false"
                    :item="item"
                    :event="event"
                    :isClicked="item.id === planSelected"
                    :planId="planSelected"
                    :lessonId="lessonSelected"
                    :subjectId="subjectId"
                    :addCommentUrl="addCommentUrl"
                    :getCommentsUrl="getCommentsUrl"
                    :addFilesUrl="addFilesUrl"
                    :lessonPlanUrl="lessonPlanUrl"
                    :fileRemoveUrl="fileRemoveUrl"
                    :deleteInfoUrl="deleteInfoUrl"
                    :deleteCommentUrl="deleteCommentUrl"
                    :isDoneUrl="isDoneUrl"
                    :userId="userId"
                    :userStudent="userStudent"
                    ref="myLineChart"
                />
            </div>

        </div>
    </div>

</template>
<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';
import moment from "moment";
import ToDoItem from "../Diary/ToDoItem";
import DatePicker from "vue2-datepicker";
export default {
    name: 'ToDoList',
    components: {
        ToDoItem,
        DatePicker,
        PerfectScrollbar,
    },
    props: [
        'items',
        'event',
        'lessonId',
        'subjectId',
        'showUnconnected',

        'addCommentUrl',
        'getCommentsUrl',
        'addFilesUrl',
        'lessonPlanUrl',
        'fileRemoveUrl',
        'deleteInfoUrl',
        'schedulePlanUrl',
        'deleteCommentUrl',
        'isDoneUrl',

        "userId",
        "userStudent",
        "planPeriod"
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
            applyLocked: false,
            hideParents:{}
        }
    },
    watch: {
        lessonId: function (oldLesonId, newLessonId) {
            console.log('watch');
            this.planSelected = null;
            this.hideParents = {};
            this.lessonSelected = this.lessonId;
        }
    },
    methods: {
        getNumber(index) {
            return (index + 1);
        },
        getTime(date) {
            return moment(date).locale('uk').format('H:mm');
        },
        getFormat(date) {
            return moment(date).format('YYYY-MM-DD');
        },
        getDay(date) {
            return moment(date).format('DD');
        },
        getWeek(date) {
            return moment(date).locale('uk').format('dd');
        },
        getMonthYear(date) {
            return moment(date).locale('uk').format('MMM Y');
        },
        selectPlan(id, eventId) {
            if (id != this.planSelected) {
                this.planSelected = id;
                this.lessonSelected = eventId;
                const tmpHide = {};
                tmpHide[eventId] = true;
                this.hideParents = tmpHide;
            } else {
                this.planSelected = '';
                this.lessonSelected = '';
                this.hideParents = {}
            }
        },
        unselectPlan(id, eventId) {
            this.planSelected = '';
            this.lessonSelected = '';
            this.hideParents = {}
        },
        getInterval(timeFrom, duration) {
            return `
                ${moment(timeFrom).format('HH:mm')} -
                ${moment(timeFrom).add(duration, 'minutes').format('HH:mm')}`;
        },
    }
}
</script>
