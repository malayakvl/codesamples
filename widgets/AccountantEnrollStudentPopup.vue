<template>
    <div>
        <popup is-form="true"
               managed="true"
               title="Наказ на зарахування"
               v-if="showPopup"
               v-bind:visible="showPopup"
               v-bind:action="enrollUrl"
               v-bind:method="'post'"
               v-bind:is-large="true"
               v-bind:modal="true"
               @close="showPopup = false"
               @submitted="markAsEnrolled()"
        >
            <div class="columns two-columns small-gap">
                <div class="column">
                    <div class="form-group">
                        <label>Дата</label>
                        <input-datepicker name="order_date" placeholder="дата" is-form-element="true"></input-datepicker>
                    </div>

                    <div class="form-group">
                        <label>Учень</label>
                        <custom-select
                            v-bind:options="availableStudents"
                            name="student_id"
                            id-key="id"
                            value-key="student_full_name"
                            with-empty="true"
                            with-search="true"
                            placeholder="Учень"
                            v-bind:selected-by-default="studentId"
                            @change="updateStudentId($event)"
                        ></custom-select>
                    </div>

                    <div class="form-group columns two-columns small-gap">
                        <div class="column">
                            <div class="form-group">
                                <label for="study_price">Сума в місяць</label>
                                <input type="text" class="input-component" v-bind:value="currentStudent !== null ? currentStudent.price : ''"
                                       id="study_price"
                                       name="study_price"
                                       @change="updateStudentField('price', $event)" />
                            </div>
                        </div>
                        <div class="column">
                            <div class="form-group">
                                <label for="first_payment">Сума першого платежу</label>
                                <input type="text" class="input-component" v-bind:value="currentStudent !== null ? currentStudent.first_payment : ''"
                                       id="first_payment"
                                       name="first_payment"
                                       @change="updateStudentField('first_payment', $event)" />
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Пільги (%)</label>
                        <custom-number-input v-bind:value="privileges"
                                             v-bind:min="0"
                                             v-bind:max="100"
                                             v-bind:name="'privileges'"
                                             @change="updatePrivileges($event)"
                        />
                    </div>

                    <upload-file label="Додати довідку" name="privileges_file" />
                </div>
                <div class="column">
                    <div class="form-group">
                        <label for="order_number">Номер наказу</label>
                        <input type="text" id="order_number" name="order_number" class="input-component" />
                    </div>

                    <div class="form-group form-group-checkbox with-mocked-label">
                        <label>
                            <input type="checkbox" name="is_self_sufficiency" value="1" />
                            <div class="checkbox-placeholder"></div>
                            <span class="label-value">Самоокупність</span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="payment_code">Платіжний код</label>
                        <input type="text" id="payment_code" name="payment_code" class="input-component"
                               v-bind:value="currentStudent !== null ? currentStudent.payment_code : ''"
                               @change="updateStudentField('payment_code', $event)"
                        />
                    </div>

                    <upload-file name="order_file" label="Додати файл наказу" />
                </div>
            </div>
        </popup>
    </div>
</template>

<script>
import bus from './../bus'

export default {
    name: "AccountantEnrollStudentPopup",
    props: [ 'enrollUrl', 'students' ],
    data() {
        return {
            showPopup: false,
            studentId: null,
            notEnrolledStudents: [],
            privileges: 0
        }
    },
    computed: {
        currentStudent() {
            let find = this.notEnrolledStudents.find(s => s.id === this.studentId);
            if (find === undefined) {
                return null;
            }
            return find;
        },
        availableStudents() {
            return this.notEnrolledStudents.filter(s => typeof s.enrolled === "undefined" || !s.enrolled);
        }
    },
    mounted() {
        this.notEnrolledStudents = JSON.parse(this.students);

        bus.$on('enroll-student', (id) => this.showEnrollmentPopup(Number(id)));
    },
    methods: {
        showEnrollmentPopup(studentId) {
            this.studentId = studentId;
            this.showPopup = true;
        },
        updateStudentId(id) {
            this.studentId = id;
        },
        updatePrivileges(value) {
            this.privileges = value;
        },
        updateStudentField(field, e) {
            const student = this.notEnrolledStudents.find(s => s.id === this.studentId);
            if (student !== undefined) {
                student[field] = e.target.value;
            }
        },
        markAsEnrolled() {
            this.currentStudent.enrolled = true;

            const row = document.querySelector(`#student-row-${this.studentId}`);
            const headlines = document.querySelectorAll(`.student-headline-${this.studentId}`);
            const orderButton = document.querySelector('.order-button');

            if (row !== null) {
                const threeDots = row.querySelector('.three-dots-action');
                const deleteButton = row.querySelector('.delete-link');
                row.classList.remove('row-bold');
                threeDots.parentElement.removeChild(threeDots);
                deleteButton.parentElement.parentElement.removeChild(deleteButton.parentElement);
            }
            for (let i = 0; i < headlines.length; i++) {
                const headline = headlines[i];
                const deleteButton = headline.querySelector('.delete-student');
                const offsetRight = headline.querySelector('.offset-right-medium');

                deleteButton.parentElement.parentElement.removeChild(deleteButton.parentElement);

                if (offsetRight !== null) {
                    offsetRight.classList.remove('offset-right-medium');
                }
            }
            if (orderButton !== null) {
                orderButton.parentElement.parentElement.removeChild(orderButton.parentElement);
            }
        }
    }
}
</script>

<style scoped>

</style>
