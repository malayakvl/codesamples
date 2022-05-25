<template>
    <div>
        <div class="schedule" v-if="lessonId && !hasError">
            <h3>Журнал відміток</h3>
            <table v-if="Object.keys(lessonDates).length > 0 && students.length > 0">
                <thead>
                <tr>
                    <th class="sticky-col"></th>
                    <th
                        v-bind:class="{ active: currentDate == date.time }"
                        v-for="(date, index) in lessonDatesWithTime"
                        v-bind:id="`date-${date.time}`">
                        {{date.time}}
                    </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="student in students" v-bind:id="`student-${student.id}`">
                    <td class="student-name sticky-col">
                        {{student.full_name}}
                    </td>
                    <td v-bind:class="{ active: currentDate === date.time }"
                        v-for="(date, index) in lessonDatesWithTime"
                        v-bind:id="`date-${index}`"
                        @click="addRate(student.id, date.time, student.full_name, lessonDatesWithTime[index]['eventId'])">
                        <div v-bind:visible="currentDate === date.time">
                            <span v-if="rates[lessonDatesWithTime[index]['eventId']]">
                                <em v-if="rates[date.eventId][student.id] && currentDate === date.time"
                                    v-bind:class="{ badge: rates[date.eventId][student.id].is_absent === 1 }">
                                    {{ rates[date.eventId][student.id].is_absent ? 'x' :
                                    rates[date.eventId][student.id].rate > 0 ? rates[date.eventId][student.id].rate : '' }}
                                </em>
                                <em v-if="rates[date.eventId][student.id] && currentDate !== date.time"
                                    v-b-tooltip="{
                                        title: `Опис:<br/>${rates[date.eventId][student.id].description || 'немає' }`,
                                        placement: 'bottom',
                                        variant: 'primary',
                                        html: true }"
                                    v-bind:class="{ badge: rates[date.eventId][student.id].is_absent === 1 }"
                                >
                                   {{ rates[date.eventId][student.id].is_absent ? 'x' :
                                        rates[date.eventId][student.id].rate > 0 ? rates[date.eventId][student.id].rate : '' }}
                                </em>
                            </span>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
            <div class="clearfix"></div>
            <div class="row" v-if="Object.keys(lessonDates).length === 0 || students.length === 0">
                <div class="col-12">
                    <div class="alert alert-primary" role="alert">
                        <p>У групі нема учнів / або не розставлені заняття</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="!lessonId || hasError">
            <p>Оберіть предмет</p>
        </div>

        <popup is-form="false"
               :title="popupTitle"
               v-bind:visible="showPopup"
               id="lessonGradebook"
               v-bind:modal="true"
               v-if="showPopup"
               managed="true"
               @close="discardEvent()"
               @apply="applyEvent()"
        >
            <div class="column">
                <div class="form-group offset-bottom-large">
                    <label for="rate">
                        Відмітка
                    </label>
                    <input
                        type="number"
                        id="rate"
                        :max=12
                        :min=1
                        name="rate"
                        class="input-component input-rate "
                        v-bind:class="this.lockRate ? 'disabled' : ''"
                        :disabled="this.lockRate"
                        autocomplete="off"
                        v-model="rate"
                    />
                </div>
                <div class="form-group form-group-checkbox">
                    <label>
                        <input type="checkbox" value="1" v-bind:name="absent" v-model="absent" @click="checkRate" />
                        <div class="checkbox-placeholder">Відсутній</div>
                    </label>
                </div>
                <div class="form-group offset-bottom-large">
                    <label>
                        Опис
                    </label>
                    <textarea
                        type="text"
                        id="rateDescription"
                        name="rateDescription"
                        class="input-component"
                        autocomplete="off"
                        v-model="rateDescription"
                    />
                </div>
            </div>
        </popup>
    </div>
</template>

<script>
import moment from 'moment';
import { BTooltip, BButton, TooltipPlugin } from 'bootstrap-vue'
import 'bootstrap-vue/dist/bootstrap-vue.css'
export default {
    name: 'ToDoGradebook',
    components: {
        BTooltip,
        BButton,
        TooltipPlugin
    },
    props:[
        'period',
        'lessonId',
        'studentsUrl',
        'eventDate',
        "eventId",

        'getRateUrl',
        'addRateUrl'

    ],
    computed: {
        isPopupModal() {
            return this.popupMode === 'default';
        }
    },
    mounted() {
    },
    data() {
        return {
            periodDates : [],
            showModal: false,
            selectedStudent: null,
            students: [],
            lessonDates: {},
            lessonDatesWithTime: {},
            currentDate: '',
            rates: [],
            rateEventId: '',

            showPopup: false,
            lockPopup: false,
            errors: [],
            popupMode: 'default',
            rateDescription: "",
            rate: "",
            absent: false,
            popupTitle: 'Відмітка учня',
            hasError: false,
            lockRate: false
        }
    },
    watch: {
        lessonId: function (oldLessonId, newLessonId) {
            this.getGradebook(this.lessonId)
        },
        planPeriod: function (value) {
            // console.log(value)
            // this.getGradebook(this.lessonId)
        },
    },
    methods: {
        checkRate() {
          if(!this.absent) {
              this.rate = '';
              this.lockRate = true;
          } else {
              this.lockRate = false;
          }
        },
        discardEvent() {
            this.showPopup = false;
            this.lockRate = false;
            // this.errors = [];
            this.popupMode = 'default';
        },
        getFormat(date) {
            return moment(date).format('DD.MM');
        },
        applyEvent() {
            document.body.classList.add('lock-loading');
            axios.post(this.addRateUrl, {
                eventId: this.rateEventId,
                lessonId: this.rateEventId,
                studentId: this.selectedStudent,
                date: this.currentDate,
                rate: this.rate,
                absent: this.absent,
                description: this.rateDescription,
                dateFrom: this.period[0],
                dateTo: this.period[1]
            })
                .then(response => response.data)
                .then(response => {
                    this.students = response.students;
                    // this.lessonDates = response.period;
                    this.lessonDates = response.periodWithTime;
                    this.lessonDatesWithTime = response.periodWithTime;
                    this.currentDate = response.currentDate;
                    this.rates = response.arrRates;
                    this.rate = '';
                    this.absent = false;
                    this.rateDescription = '';
                    this.lockRate = false;
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
            this.showPopup = false;

        },
        getGradebook(lesonId) {
            document.body.classList.add('lock-loading');
            if (this.lessonId) {
                axios.get(`${this.studentsUrl}?lessonId=${this.lessonId ? this.lessonId : ''}&dateFrom=${this.period[0]}&dateTo=${this.period[1]}`)
                    .then(response => response.data)
                    .then(response => {
                        this.hasError = false;
                        this.students = response.students;
                        this.lessonDates = response.period;
                        this.lessonDatesWithTime = response.periodWithTime;
                        this.currentDate = response.currentDate
                        this.rates = response.arrRates;
                        document.body.classList.remove('lock-loading');
                    })
                    .catch((e) => {
                        this.hasError = true;
                        document.body.classList.remove('lock-loading');
                    })
                ;
            }

        },
        addRate(studentId, dateSelected, student, eventId) {
            if (dateSelected === this.currentDate) {
                this.showPopup = true;
                this.selectedStudent = studentId;
                this.popupTitle = `Відмітка учня ${student}`;
                document.body.classList.add('lock-loading');
                this.lockRate = false;
                this.rate = '';
                this.absent = false;
                this.rateDescription = '';
                this.rateEventId = eventId;
                axios.get(`${this.getRateUrl}?studentId=${studentId}&date=${dateSelected}&eventId=${eventId}`)
                    .then(response => response.data)
                    .then(response => {
                        this.rate = response.rate.rate > 0 ? response.rate.rate : '';
                        this.absent = response.rate.is_absent === 1 ? true : false;
                        this.lockRate = response.rate.is_absent === 1;
                        this.rateDescription = response.rate.description;
                        document.body.classList.remove('lock-loading');
                    })
                    .catch((e) => {
                        document.body.classList.remove('lock-loading');
                    })
                ;
            } else {
                this.showPopup = false;
            }

        },
        submitRate() {
            this.showModal = false;
        }
    }
}
</script>
