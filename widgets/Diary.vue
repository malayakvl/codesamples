<template>
    <div>
        <div class="container-fluid top-20">
            <div class="row g-3">
                <div class="col-4 col-xl-4">
                    <div class="block-white">
                        <div class="card-test">
                            <div class="filter-group">
                                <div class="row">
                                    <div class="col-12">
                                        <v-select
                                            v-model="subjectSelected"
                                            class="w-100"
                                            :options="listSubjects"
                                            @input="changeSubject(subjectSelected ? subjectSelected.id : '')"
                                            label="name"
                                        />
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12">
                                        <date-picker range v-model="planPeriod"
                                                     valueType="format"
                                                     @change="changePeriod"
                                                     placeholder="Вибір періоду"
                                        />
                                    </div>

                                </div>
                            </div>
                        </div>
                        <perfect-scrollbar class="lessons-block">
                            <div class="dashboard-card  filter-group filter-lesson">
                                <div class="w-100" v-for="(event, index) in events"
                                     v-bind:id="`event-${event.id}`">
                                    <div class="block-lesson"

                                         @click="changeLesson(event)"
                                         v-bind:class="{active:event.id == lessonSelected}"
                                    >
                                        <div class="row">
                                            <div class="col-3">
                                                <div class="date date-diary">
                                                    {{ getDay(event.fire_at) }}
                                                    <em>{{ getMonthYear(event.fire_at) }}</em>
                                                </div>
                                            </div>
                                            <div class="col-9 position-relative">
                                                <div class="name w-100">
                                                    {{event.subjectName}}
                                                    <em class="w-100">{{ event.audienceName}}</em>
                                                    <em>{{ getInterval(event.fire_at, event.duration) }}</em>
                                                </div>
                                                <div class="student student-diary">{{ event.title}}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="separator" v-show="events[(index+1)] ? event.fire_until != events[(index+1)].fire_until : false"></div>
                                </div>


                            </div>
                        </perfect-scrollbar>
                    </div>
                </div>
                <div class="col-8 col-xl-8">
                    <div class="row g-0">
                        <div class="col-12">
                            <div class="block-white">
                                <div class="row g-0">
                                    <div class="col-12"><h1 class="headline-text headline-text-diary">{{blockTitle}}</h1></div>
                                    <div class="col-12">
                                        <div class="alert alert-info" role="alert" v-show="!lessonSelected">
                                            <p>Оберіть предмет</p>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="alert alert-info" role="alert" v-show="lessonSelected && planList.length === 0">
                                            <p>Немає завдань</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <perfect-scrollbar>
                                        <ToDoList
                                            :items="planList"
                                            :lessonId="lessonSelected"
                                            :event="eventSelected"
                                            :lessonPlanUrl="lessonPlanUrl"
                                            :addCommentUrl="addCommentUrl"
                                            :getCommentsUrl="getCommentsUrl"
                                            :deleteCommentUrl="deleteCommentUrl"
                                            :fileRemoveUrl="fileRemoveUrl"
                                            :addFilesUrl="addFilesUrl"
                                            :isDoneUrl="isDoneUrl"
                                            :userId="userId"
                                            :userStudent="userStudent"
                                            :planPeriod="planPeriod"
                                        />
                                    </perfect-scrollbar>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';
import 'vue2-datepicker/locale/uk';
import { PerfectScrollbar } from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css';

import moment from "moment";

import ToDoList from "./Diary/ToDoList";
import axios from "axios";

export default {
    name: "Diary",
    components: {
        'v-select': vSelect,
        DatePicker,
        PerfectScrollbar,
        ToDoList
    },
    props: [
        "schedulePlanUrl",
        "getPlanUrl",
        "lessonPlanUrl",
        "addCommentUrl",
        "getCommentsUrl",
        "deleteCommentUrl",
        "fileRemoveUrl",
        "addFilesUrl",
        "isDoneUrl",
        "studyProgramsUrl",
        "userId",
        "userStudent",
        "studentId"
    ],
    data() {
        return {
            planPeriod: [moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')],
            lessonSelected: null,
            subjectSelected: [{ name: "Всі заняття", id: '' }],
            listSubjects: [],
            filterName: '',
            dayOfWeek: 0,
            isActive: false,
            events: [],
            planList: [],
            lessonEvents: {},
            listLessons: [],
            subjectName: null,
            isNinja: false,
            dateSelected: null,
            showUnconnected: true,
            connectedName: 'fa-square-full',
            eventDate: '',
            blockTitle: '',

            subjectId: '',
            groupId: '',
            eventSelected: {},

            eventForReload: {},
        };
    },
    mounted() {
        this.planPeriod = [
            moment().clone().startOf('week').format('YYYY-MM-DD'),
            moment().clone().endOf('week').format('YYYY-MM-DD')
        ];
        this.loadEvents(
            moment().clone().startOf('week').format('YYYY-MM-DD'),
            moment().clone().endOf('week').format('YYYY-MM-DD')
        );
        this.getStudyPrograms();
    },
    methods: {
        changeSubject(subjectId = '') {
            if (!subjectId) {
                this.subjectSelected = [{ name: "Всі заняття", id: '' }];
            }
            this.subjectId = subjectId;
            this.loadEvents(
                this.planPeriod[0], this.planPeriod[1]
            )
        },
        getStudyPrograms() {
            axios.get(`${this.studyProgramsUrl}?student_id=${this.studentId}`)
                .then(response => response.data)
                .then(response => response.data)
                .then(response => {
                    this.studyPrograms = response;
                    const subjects = [];
                    response.forEach(data => {
                        data.subjects.forEach(subject => {
                            subjects.push({id: subject.id, name: subject.name});
                        });
                        if (data.additional_subjects.length > 0) {
                            const additionalSubjects = this.getAttachedAdditionalSubjects(data);
                            if (additionalSubjects.length > 0) {
                                additionalSubjects.forEach(subject => {
                                    subjects.push({id: subject.id, name: subject.name});
                                });
                            }
                        }
                    });
                    const emptySubjects = [{ name: "Всі заняття", id: '' }];
                    this.listSubjects = [...emptySubjects, ...subjects];
                })
            ;
        },
        getAttachedAdditionalSubjects(sp) {
            return sp.additional_subjects
                .filter(p => sp.attached_additional_subjects.indexOf(p.id) > -1);
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
        changeLesson(event) {
            document.body.classList.add('lock-loading');
            this.eventForReload = event;
            this.blockTitle = '';
            this.loadPlan(event.subjectId, event);
            this.blockTitle = `План занять | ${event.subjectName}`;
        },
        changePeriod() {
            if (this.planPeriod) {
                this.loadEvents(
                    this.planPeriod[0], this.planPeriod[1]
                )
            }
        },
        loadEvents(dateFrom, dateTo) {
            this.events = [];
            let url = this.schedulePlanUrl;
            document.body.classList.add('lock-loading');
            axios.get(
                `${this.schedulePlanUrl}?dateFrom=${dateFrom}&dateTo=${dateTo}&subjectId=${this.subjectId}`
            )
                .then(response => response.data)
                .then(response => {
                    this.events = response.events;
                    const emptyLesson = [{ g_name: "Всі заняття", id: '' }];
                    this.listLessons = [...emptyLesson, ...response.lessons];
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        loadPlan(subjectId = '', event = '', searchStr = '') {
            document.body.classList.add('lock-loading');
            axios.get(`${this.getPlanUrl}?subjectId=${subjectId}&lessonId=${event ? event.id : ''}&dateFrom=${this.planPeriod[0]}&dateTo=${this.planPeriod[1]}`)
                .then(response => response.data)
                .then(response => {
                    this.planList = response.planList;
                    if (event) {
                        this.lessonSelected = event.id;
                        this.eventSelected = event;
                        // this.subjectSelected = event.subjectId;
                        this.subjectName = event.subject_name;
                        this.dateSelected = moment(event.fire_at).format('YYYY-MM-DD');
                    }
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    console.log('error', e);
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
    }
}
</script>
