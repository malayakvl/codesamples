<template>
    <div class="accountant-payments-page form" v-bind:class="{'lock-loading': lock}">
        <div class="headline offset-bottom-large">
            <h1 class="headline-text">Платежі</h1>
            <a v-bind:href="archiveUrl" class="button button-large button-default">Архів платежей</a>
            <a href="javascript:" class="button button-large button-default offset-left-20" @click="uploadFile()">
                <img svg-inline src="./../../svg/upload-icon.svg" class="icon" /><!--
                --><span>Вивантажити файл казначейства</span>
            </a>
            <a v-bind:href="exportFileUrl" class="button button-large button-default offset-left-20" target="_blank">
                <img svg-inline src="./../../svg/download-icon.svg" class="icon" /><!--
                --><span>Завантажити файл казначейства</span>
            </a>
            <a v-bind:href="manualUrl" class="button button-large button-accent offset-left-20">
                <img svg-inline src="./../../svg/plus-icon.svg" class="icon" /><!--
                --><span>Додати</span>
            </a>
        </div>
        <div class="columns two-columns">
            <div class="column">
                <div class="search-input-container">
                    <input type="text" class="search-input" placeholder="Пошук по платежам" v-model="searchPayments" />
                    <img svg-inline src="./../../svg/payments-search-icon.svg" class="icon input-icon" />
                </div>
                <div class="card card-medium offset-top-large">
                    <div class="card-header">
                        <div class="card-icon">
                            <img src="/assets/icons/receipt_24px.png" />
                        </div>
                        <div class="card-title">Платежі</div>
                        <div class="card-actions">
                            <nav class="tabs">
                                <a href="javascript:" v-bind:class="{active: paymentsMode === 'processed'}"
                                   @click="switchToPayments('processed')"><span>Розпізнані</span></a><!--
                            --><a href="javascript:" v-bind:class="{active: paymentsMode === 'unprocessed'}"
                                  @click="switchToPayments('unprocessed')"><span>Нерозпізнані</span></a>
                            </nav>
                        </div>
                    </div>
                    <div class="card-content">
                        <table class="table table-accountant-payments">
                            <thead>
                            <tr>
                                <th class="no-padding-left column-date">Дата</th>
                                <th class="column-full-name">ПІБ</th>
                                <th class="column-sum column-sum-header" colspan="2">Сума (грн)</th>
                            </tr>
                            </thead>
                            <tbody>
                            <template v-for="record in paymentsRecords">
                                <tr @click="selectPayment(record)">
                                    <td class="no-border-bottom no-padding-left column-date">{{ record.payment_date }}</td>
                                    <td class="no-border-bottom column-full-name">
                                         <div class="student-full-name">
                                             <span v-if="record.metadata.isStudentFound">{{ record.metadata.studentName }}</span>
                                             <span v-else>Учня не знайдено</span>
                                             <span class="payment-code">{{ record.code }}</span>
                                         </div>
                                        <div v-if="record.metadata.isTeacherFound">
                                            <span class="teacher-name">Вчитель: {{ record.metadata.teacherName }}</span>
                                        </div>
                                    </td>
                                    <td class="no-border-bottom column-sum">
                                        <div class="money">{{ record.delta.toFixed(2) }}</div>
                                        <template v-if="!record.is_processed">
                                            <div class="error" v-if="record.payment_code === null">код відсутній</div>
                                            <div class="error" v-if="record.metadata.isStudentFound === false">учня не знайдено</div>
                                            <div class="error" v-if="record.metadata.isTeacherFound === false">вчителя не знайдено</div>
                                        </template>
                                    </td>
                                    <td class="no-border-bottom column-checkbox">
                                        <div class="form-group form-group-radio" v-if="!record.is_processed">
                                            <label>
                                                <input type="radio" name="payment" v-bind:value="record.id" v-bind:checked="isPaymentSelected(record)" /><!--
                                            --><div class="radio-placeholder"></div>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                                <tr @click="selectPayment(record)">
                                    <td colspan="4" class="column-payment-description">{{ record.description }}</td>
                                </tr>
                            </template>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="column">
                <div class="search-input-container">
                    <input type="text" class="search-input" placeholder="Пошук учня" v-model="searchStudents" />
                    <img svg-inline src="./../../svg/payments-search-icon.svg" class="icon input-icon" />
                </div>
                <div class="card card-medium offset-top-large">
                    <div class="card-header">
                        <div class="card-icon">
                            <img src="/assets/icons/human-icon.png" />
                        </div>
                        <div class="card-title">Учні</div>
                        <div class="card-actions">
                            <nav class="tabs">
                                <a href="javascript:" v-bind:class="{active: students === 'new'}" @click="switchToStudents('new')"><span>Всі</span></a><!--
                            --><a href="javascript:" v-bind:class="{active: students === 'debtors', 'with-badge': debtors.length > 0}" @click="switchToStudents('debtors')">
                                <span>Боржники</span><!--
                                --><span class="badge" v-if="debtors.length > 0">{{ debtors.length }}</span>
                            </a>
                            </nav>
                        </div>
                    </div>
                    <div class="card-content">
                        <table class="table table-accountant-students">
                            <thead>
                            <tr>
                                <th class="column-full-name">ПІБ</th>
                                <th class="column-school">Школа</th>
                                <th class="column-balance">Баланс</th>
                                <th class="column-checkbox">&nbsp;</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="student in studentsRecords" @click="selectStudent(student)">
                                <td class="column-full-name">
                                    <div class="full-name">{{ student.student_full_name }}</div>
                                    <div class="teachers">
                                        <div class="teacher" v-for="teacher in student.teachers">
                                            <span class="teacher-name">Вчитель: {{ teacher.full_name }}</span>
                                            <span class="teacher-phone">{{ teacher.phone_number }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="column-school">{{ student.school_name }}</td>
                                <td class="column-balance"><span v-bind:class="{'text-danger': student.balance < 0}">{{ student.balance.toFixed(2) }}</span></td>
                                <td class="column-checkbox">
                                    <div class="form-group form-group-radio">
                                        <label>
                                            <input type="radio" name="student" v-bind:value="student.id" v-bind:checked="isStudentSelected(student)" /><!--
                                            --><div class="radio-placeholder"></div>
                                        </label>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <a href="javascript:" class="button button-medium-larger button-glow button-primary floating-button"
           @click="assignItem()"
           v-if="selectedUser !== '-' && selectedPayment !== -1"
        >Зачислить платеж</a>
        <div style="display: none;">
            <input type="file" ref="file" @change="sendFile($event)" />
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: "AccountantPayments",
    props: [
        'processFileUrl',
        'studentsUrl',
        'assignItemUrl',
        'unprocessedUrl',
        'exportFileUrl',
        'manualUrl',
        'archiveUrl'
    ],
    data() {
        return {
            payments: [],

            newStudents: [],
            debtors: [],

            paymentsMode: 'processed',
            students: 'new',
            searchPayments: '',
            searchStudents: '',

            selectedPayment: -1,
            selectedUser: '-',

            lock: false
        };
    },
    computed: {
        paymentsRecords() {
            const items = this.payments.filter(item => item.is_processed === (this.paymentsMode === 'processed'));

            let searchRequestLower = this.searchPayments.toLowerCase();

            if (searchRequestLower.length < 1) {
                return items;
            }

            return items
                .filter(record =>
                    record.description.toLowerCase().indexOf(searchRequestLower) > -1
                    || record.code.toLowerCase().indexOf(searchRequestLower) > -1
                    || record.delta === Number(searchRequestLower)
                );
        },
        studentsRecords() {
            const items = this.students === 'new' ? this.newStudents : this.debtors;

            let searchRequestLower = this.searchStudents.toLowerCase();

            if (searchRequestLower.length < 1) {
                return items;
            }

            return items
                .filter(record =>
                    record.student_full_name.toLowerCase().indexOf(searchRequestLower) > -1
                    || record.school_name.toLowerCase().indexOf(searchRequestLower) > -1
                );
        }
    },
    mounted() {
        axios.get(this.studentsUrl)
            .then(response => response.data)
            .then(response => {
                this.newStudents = response.newStudents;
                this.debtors = response.debtors;
            });
        axios.get(this.unprocessedUrl)
            .then(response => response.data)
            .then(response => this.payments = response);
    },
    methods: {
        uploadFile() {
            this.$refs.file.click();
        },
        sendFile(event) {
            const files = event.target.files;
            if (files.length < 1) {
                return ;
            }

            const file = files[0];
            const formData = new FormData();
            formData.append('file', file);

            this.lock = true;
            axios.post(`${this.processFileUrl}`, formData)
                .then(response => response.data)
                .then(response => {
                    this.payments = response;
                })
                .then(() => this.$refs.file.value = null)
                .then(() => this.lock = false)
                .catch(() => {
                    this.$refs.file.value = null;
                    this.lock = false;
                })
            ;
        },
        switchToPayments(paymentsMode) {
            this.paymentsMode = paymentsMode;
        },
        switchToStudents(studentsMode) {
            this.students = studentsMode;
        },
        isPaymentSelected(payment) {
            return payment.id === this.selectedPayment;
        },
        isStudentSelected(student) {
            return `${student.id}-${student.teacher_id}` === this.selectedUser;
        },
        selectPayment(payment) {
            if (payment.is_processed) {
                return ;
            }
            this.selectedPayment = payment.id;
        },
        selectStudent(student) {
            this.selectedUser = `${student.id}-${student.teacher_id}`;
        },
        assignItem() {
            const paymentId = this.selectedPayment;
            const studentId = Number(this.selectedUser.split('-').shift());
            const payment = this.payments.find(i => i.id === paymentId);
            const debtor = this.debtors.find(d => d.id === studentId);
            const newStudent = this.newStudents.find(s => s.id === studentId);

            const student = debtor || newStudent;

            axios.post(this.assignItemUrl, { paymentId, studentId })
                .then(response => response.data)
                .then(response => alert(response.message))
                .then(() => payment.is_processed = true)
                .then(() => this.selectedPayment = -1)
                .then(() => this.selectedUser = '-')
                .then(() => student.balance += payment.delta)
                .catch((err) => alert(err.response.data.message))
            ;
        }
    }
}
</script>

<style scoped>

</style>
