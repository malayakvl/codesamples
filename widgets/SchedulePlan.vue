<template>
    <div>
        <div class="container-fluid top-20">
            <div class="row g-3">
                <div class="col-lg-3 col-12">
                    <div class="block-white">
                        <div class="card-test">
                            <div class="dashboard-card filter-group">
                                <v-select
                                    v-show="canChangeTeacher"
                                    v-model="teacherSelected"
                                    @input="changeTeacher(teacherSelected ? teacherSelected.id : '')"
                                    :options="listTeachers"
                                    label="full_name"
                                />
                                <v-select
                                    v-model="groupSelected"
                                    @input="changeGroup(groupSelected ? groupSelected.id : '')"
                                    :options="listGroups"
                                    label="name"
                                />
                            </div>
                            <div class="clearfix"></div>
                            <div class="dashboard-card filter-group">
                                <date-picker range v-model="planPeriod"
                                         valueType="format"
                                         @change="changePeriod"
                                         placeholder="Вибір періоду"
                                />
                            </div>
                            <div class="clearfix"></div>
                            <perfect-scrollbar class="lessons-block row">
                                <div class="dashboard-card  filter-group filter-lesson">
                                    <div class="block-lesson row"
                                         v-for="event in events"
                                         v-bind:id="`event-${event.id}`"
                                         @click="changeLesson(event)"
                                         v-bind:class="{active:event.id == lessonSelected}"
                                    >
                                        <div class="col-3">
                                            <div class="date">
                                                {{ getDay(event.fire_at) }}
                                                <em>{{ getMonthYear(event.fire_at) }}</em>
                                            </div>
                                        </div>
                                        <div class="col-9 position-relative">
                                            <div class="name w-100">
                                                {{event.title}}
                                                <em class="w-100">{{ event.subjectName}}</em>
                                                <em>{{ getInterval(event.fire_at, event.duration) }}</em>
                                            </div>
                                            <div class="student">{{ event.teacherName}}</div>
                                        </div>
                                    </div>
                                </div>
                            </perfect-scrollbar>
                        </div>
                        <div class="clearfix"></div>
                    </div>
                </div>
                <div class="col-lg-6 col-12">
                    <div class="block-white">
                        <div class="row g-0">
                            <div class="col-10">
                                <a class="show-all" v-show="canViewAllPlan && lessonSelected" href="javascript:;" @click="loadPlanAll()" title="Переглянути усі"><i class="fas fa-arrow-circle-left"></i></a>
                                <div class="row g-0 plan-filter form">
                                    <div class="col-4" v-show="!lessonSelected">
                                        <div class="form-group" style="margin-bottom: 0px;">
                                            <v-select
                                                v-model="filterSubject"
                                                :options="filterSubjects"
                                                label="name"
                                                @input="changeSubject(filterSubject ? filterSubject.id : '')"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-5">
                                        <input
                                            type="text"
                                            id="filterName"
                                            name="filterName"
                                            class="input-component"
                                            autocomplete="off"
                                            v-model="filterName"
                                        />
                                    </div>
                                    <div class="col-3">
                                        <button type="button" @click="applyFilter" class="btn btn-default btn-filter" title="Фільтрувати">
                                            <i class="fas fa-filter"></i>
                                        </button>
                                        <a href="javascript:;" title="Очистити фільтр" @click="resetFilter" class="btn btn-default btn-reset"><i class="fas fa-redo-alt"></i></a>
                                        <a href="javascript:;"
                                           v-show="lessonSelected"
                                           title="Сховати не звязані" @click="hideUnconnected"
                                           class="btn btn-default btn-filter">
                                            <i class="fas fa-square-full" v-show="!showUnconnected"></i>
                                            <i class="fas fa-check-square" v-show="showUnconnected"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-2">
                                <a class="add-plan" v-show="canAddPlan" href="javascript:;" v-on:click="isNinja = !isNinja" title="Додати"><i class="fas fa-plus-circle"></i></a>
                            </div>
                        </div>

                        <div v-show="isNinja">
                            <ToDoForm
                                :subjectId="subjectSelected"
                                :lessonId="lessonSelected"
                                :subjects="{schoolSubjects}"
                                @todo-added="addToDo"></ToDoForm>
                        </div>
                        <div class="row">
                            <perfect-scrollbar>
                                <ToDoList
                                    :items="planList"
                                    :lessonId="lessonSelected"
                                    :event="eventSelected"
                                    :subjectId="subjectSelected"
                                    :showUnconnected="showUnconnected"
                                    :addCommentUrl="addCommentUrl"
                                    :getCommentsUrl="getCommentsUrl"
                                    :addHomeFilesUrl="addHomeFilesUrl"
                                    :lessonPlanUrl="lessonPlanUrl"
                                    :fileRemoveUrl="fileRemoveUrl"
                                    :deleteInfoUrl="deleteInfoUrl"
                                    :schedulePlanUrl="schedulePlanUrl"
                                    :copyInfoUrl="copyInfoUrl"
                                    :deleteCommentUrl="deleteCommentUrl"

                                    @plan-reload="reloadPlan"
                                />
                            </perfect-scrollbar>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-3">
                    <div class="block-white">
                        <perfect-scrollbar class="lessons-gradebook">
                            <ToDoGradebook
                                :period="planPeriod"
                                :studentsUrl="lessonStudentsUrl"
                                :lessonId="lessonSelected"
                                :eventDate="dateSelected"
                                :eventId="eventSelected.id"
                                :addRateUrl="addRateUrl"
                                :getRateUrl="getRateUrl"
                            />
                        </perfect-scrollbar>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css';
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';
import 'vue2-datepicker/locale/uk';
import { PerfectScrollbar } from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'
import moment from 'moment';

import ToDoForm from './SchedulePlan/ToDoForm';
import ToDoList from "./SchedulePlan/ToDoList";
import ToDoGradebook from "./SchedulePlan/ToDoGradebook";

export default {
    name: "SchedulePlan",
    components: {
        'v-select': vSelect,
        DatePicker,
        PerfectScrollbar,
        ToDoForm,
        ToDoList,
        ToDoGradebook
    },
    props: [
        'variant',
        'isCard',
        'schoolSchedule',
        'schoolSubjects',

        'getPlanUrl',
        'addPlanUrl',
        'addCommentUrl',
        'getCommentsUrl',
        'schedulePlanUrl',
        'addHomeFilesUrl',
        'lessonPlanUrl',
        'lessonStudentsUrl',
        'getRateUrl',
        'addRateUrl',
        'fileRemoveUrl',
        'deleteInfoUrl',
        'copyInfoUrl',
        'deleteCommentUrl',

        'studyPrograms',
        'teachers',
        'groups',
        'subgroups',
        'students',

        'canChangeTeacher',
        'canAddPlan',
        'canViewAllPlan'
    ],

    data() {
        return {
            teacherSelected: [{ full_name: "Всі вчителі", id: '' }],
            groupSelected: [{ name: "Всі групи", id: '' }],
            lessonsSelected: [{ g_name: "Всі заняття", id: '' }],
            filterSubjects: [{ name: "Всі заняття", id: '' }],
            filterSubject: [{ name: "Всі заняття", id: '' }],
            planPeriod: [moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')],
            lessonSelected: null,
            subjectSelected: null,
            filterName: '',
            dayOfWeek: 0,
            isActive: false,
            events: [],
            planList: [],
            lessonEvents: {},
            listGroups: [],
            listTeachers: [],
            listLessons: [],
            subjectName: null,
            isNinja: false,
            dateSelected: null,
            showUnconnected: true,
            connectedName: 'fa-square-full',

            teacherId: '',
            groupId: '',
            eventSelected: {},

            eventForReload: {},
        };
    },
    computed: {

    },
    mounted() {
        this.planPeriod = [
            moment().clone().startOf('month').format('YYYY-MM-DD'),
            moment().clone().endOf('month').format('YYYY-MM-DD')
        ];
        this.loadEvents(
            moment().clone().startOf('month').format('YYYY-MM-DD'),
            moment().clone().endOf('month').format('YYYY-MM-DD')
        );
        this.loadPlan('');
        const emptyGroup = [{ name: "Всі групи", id: '' }];
        this.listGroups = [...emptyGroup, ...JSON.parse(this.groups)];

        const emptyTeacher = [{ full_name: "Всі вчителі", id: '' }];
        this.listTeachers = [...emptyTeacher, ...JSON.parse(this.teachers)];

        this.listLessons = [{ g_name: "Всі заняття", id: '' }];

        const emptySubject = [{ name: "Всі заняття", id: '' }];
        this.filterSubjects = [...emptySubject, ...JSON.parse(this.schoolSubjects)];
    },
    beforeDestroy() {
        document.removeEventListener('mousemove', this.mouseMove);
        document.removeEventListener('mouseup', this.mouseUp);
        document.removeEventListener('mousedown', this.mouseDown);
    },
    methods: {
        reloadPlan() {
            this.lessonSelected = '';
            this.planList = [];
            this.loadPlan(this.eventForReload.subjectId, this.eventForReload);
        },
        applyFilter() {
            if ((this.filterSubject.id || this.filterName && !this.lessonSelected) || (this.lessonSelected && this.filterName)) {
                if (this.lessonSelected) {
                    this.loadFilterPlan(this.subjectSelected, this.lessonSelected, this.filterName);
                } else {
                    this.loadPlan(this.filterSubject.id, '', this.filterName);
                }
            }
        },
        hideUnconnected() {
            this.showUnconnected = !this.showUnconnected
        },
        resetFilter() {
            if (this.lessonSelected) {
                this.loadFilterPlan(this.subjectSelected, this.lessonSelected, '');
            } else {
                this.loadPlan('', '', '');
            }

            this.filterSubject = [{ name: "Всі заняття", id: '' }];
            this.filterName = '';
        },
        addToDo(toDoData) {
            document.body.classList.remove('lock-loading');
            // save form data to table
            axios.post(`${this.addPlanUrl}?subjectId=${this.subjectSelected ? this.subjectSelected : ''}&lessonId=${this.lessonSelected ? this.lessonSelected : ''}`, { toDoData })
                .then(response => response.data)
                .then(response => {
                        this.planList = response.planList;

                    }
                )
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
            this.isNinja = false;
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
            this.loadPlan(event.subjectId, event);
        },
        changeSubject(subjectId = '') {
            if (!subjectId) {
                this.filterSubject =  [{ name: "Всі заняття", id: '' }];
            }
        },
        changeTeacher(teacherId = '') {
            if (!teacherId) {
                this.teacherSelected = [{ full_name: "Всі вчителі", id: '' }];
            }
            this.teacherId = teacherId;
            this.loadEvents(
                this.planPeriod[0], this.planPeriod[1]
            )
        },
        changeGroup(groupId = '') {
            this.groupId = groupId;
            if (!groupId) {
                this.groupSelected = [{ name: "Всі групи", id: '' }];
            }
            this.loadEvents(
                this.planPeriod[0], this.planPeriod[1]
            )
        },
        changePeriod() {
            if (this.planPeriod) {
                this.loadEvents(
                    this.planPeriod[0], this.planPeriod[1]
                )
            }
        },
        loadPlanAll() {
            this.lessonSelected = '';
            this.subjectSelected = '';
            this.filterName = '';
            this.filterSubject = [{ name: "Всі заняття", id: '' }];
            this.loadPlan();
        },
        loadFilterPlan(subjectId = '', lessonId = '', searchStr = '') {
            document.body.classList.add('lock-loading');
            axios.get(`${this.getPlanUrl}?subjectId=${subjectId}&lessonId=${lessonId ? lessonId : ''}&searchStr=${searchStr}`)
                .then(response => response.data)
                .then(response => {
                    this.planList = response.planList;
                    // if (event) {
                    //     this.lessonSelected = event.id;
                    //     this.eventSelected = event;
                    //     this.subjectSelected = event.subjectId;
                    //     this.subjectName = event.subject_name;
                    //     this.dateSelected = moment(event.fire_at).format('YYYY-MM-DD');
                    // }
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    console.log('error', e);
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        loadPlan(subjectId = '', event = '', searchStr = '') {
            document.body.classList.add('lock-loading');
            axios.get(`${this.getPlanUrl}?subjectId=${subjectId}&lessonId=${event ? event.id : ''}&searchStr=${searchStr}`)
                .then(response => response.data)
                .then(response => {
                    this.planList = response.planList;
                    if (event) {
                        this.lessonSelected = event.id;
                        this.eventSelected = event;
                        this.subjectSelected = event.subjectId;
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
        loadEvents(dateFrom, dateTo) {
            let url = this.schedulePlanUrl;
            document.body.classList.add('lock-loading');
            axios.get(
            `${this.schedulePlanUrl}?dateFrom=${dateFrom}&dateTo=${dateTo}&teacherId=${this.teacherId}&groupId=${this.groupId}`
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
    }
}
</script>

<style scoped>

</style>
