<template>
    <div>
        <h1 v-if="readonly && currentPrograms.length < 1" class="text-center">Немає навчальних програм</h1>
        <div v-for="(studyProgram, index) in currentPrograms"
             class="offset-bottom-large"
             v-bind:class="{'lock-loading': studyProgram.lock}">
            <input type="hidden" v-bind:name="`study_program[${studyProgram.id}][order]`" v-bind:value="index" />
            <div class="headline offset-bottom-medium">
                <h1 class="headline-text">{{ studyProgram.name }}</h1>
                <a href="javascript:" class="button button-small button-danger button-danger-lighten" @click.prevent="removeProgram(index)" v-if="!readonly">Відкріпити навчальну програму</a>
            </div>
            <div class="columns three-columns">
                <div class="form-group">
                    <label>Рік початку навчання</label>
                    <custom-select :options="years"
                                   id-key="year"
                                   value-key="year"
                                   placeholder="Рік початку навчання"
                                   :selected-by-default="studyProgram.year || currentYear"
                                   v-bind:name="`study_program[${studyProgram.id}][year]`"
                                   @change="updateYear($event, studyProgram)"
                                   v-bind:readonly="readonly"
                    />
                </div>
                <div class="form-group" v-if="typeof groups[studyProgram.id] !== 'undefined'">
                    <label>Основна група</label>
                    <custom-select :options="groups[studyProgram.id]"
                                   id-key="id"
                                   value-key="name_with_count"
                                   placeholder="Основна група"
                                   @change="updateMainGroup($event, studyProgram)"
                                   with-empty="true"
                                   with-search="true"
                                   data-prefix="data"
                                   v-bind:selected-by-default="studyProgram.main_group"
                                   v-bind:readonly="readonly"
                                   v-bind:groups="'auto'"
                                   v-bind:name="`study_program[${studyProgram.id}][main_group_id]`"
                    />
                </div>
                <div class="form-group">
                    <label>Ціна навчання</label>
                    <custom-select id-key="id"
                                   value-key="full_name"
                                   :options="specializations"
                                   placeholder="Спеціалізація"
                                   with-empty="true"
                                   with-search="true"
                                   v-bind:selected-by-default="studyProgram.instrument_id"
                                   v-bind:readonly="readonly"
                                   v-bind:name="`study_program[${studyProgram.id}][specialization_id]`"
                    ></custom-select>
                </div>
            </div>
            <div class="columns three-columns offset-bottom-large">
                <div class="form-group">
                    <label v-bind:for="`study_program_${studyProgram.id}_payment_code`">Платіжний код</label>
                    <input type="text" class="input-component"
                           v-bind:name="`study_program[${studyProgram.id}][payment_code]`"
                           v-bind:id="`study_program_${studyProgram.id}_payment_code`"
                           v-bind:value="studyProgram.payment_code"
                           v-bind:disabled="readonly" />
                </div>
            </div>
            <table class="table study-program-subjects-table">
                <thead>
                <tr>
                    <th class="subject-column">Предмет</th>
                    <th v-for="year in studyProgram.years" class="with-input" v-bind:class="{'highlight-current': studyProgram.study_year === year}"><div class="text-center">{{ year }}</div></th>
                    <th class="action-column">&nbsp;</th>
                    <th class="action-column">Концертмейстер</th>
                </tr>
                </thead>
                <tbody>
                    <student-study-program-subject v-for="subject in studyProgram.subjects"
                                                   v-bind:key="subject.id"
                                                   v-bind:subject="subject"
                                                   v-bind:schedule="studyProgram.schedule[subject.id]"
                                                   v-bind:groups="groups[studyProgram.id]"
                                                   v-bind:student-id="studentId"
                                                   v-bind:assign-group-url="assignGroupUrl"
                                                   v-bind:study-program-id="studyProgram.id"
                                                   v-bind:name-prefix="`study_program[${studyProgram.id}][subject][main]`"
                                                   v-bind:specializations="specializations"
                                                   v-bind:teachers="getTeachersForSubject(subject)"
                                                   v-bind:teachersAccompanist="getTeachersAccompanist()"
                                                   v-bind:readonly="readonly"
                                                   v-bind:study-year="studyProgram.study_year"
                                                   v-bind:without-links="withoutLinks"
                                                   @selectSpecialization="showSelectSpecializationPopup(subject, studyProgram, true)"
                    />
                </tbody>
                <thead>
                <tr>
                    <th v-bind:colspan="studyProgram.years + 2" class="no-border no-padding-left">
                        <a href="javascript:" class="button button-small button-link" @click="showAdditionalSubjectsPopup(studyProgram)" v-if="!readonly">
                            <img svg-inline src="./../../svg/plus-icon.svg" class="icon" />
                            <span>Додати додатковий предмет</span>
                        </a>
                    </th>
                </tr>
                <tr v-if="getAttachedAdditionalSubjects(studyProgram).length > 0">
                    <th v-bind:colspan="studyProgram.years + 3">
                        <div class="text-center">Додаткові предмети</div>
                    </th>
                </tr>
                <tr v-if="getAttachedAdditionalSubjects(studyProgram).length > 0">
                    <th class="subject-column">Години</th>
                    <th v-for="year in studyProgram.years" class="with-input" v-bind:class="{'highlight-current': studyProgram.study_year === year}"><div class="text-center">{{ studyProgram.additional_total[year - 1] || 0 }}</div></th>
                    <th class="action-column">&nbsp;</th>
                    <th class="action-column">Концертмейстер</th>
                </tr>
                </thead>
                <tbody v-if="getAttachedAdditionalSubjects(studyProgram).length > 0">
                    <student-study-program-subject v-for="subject in getAttachedAdditionalSubjects(studyProgram)"
                                            v-bind:key="subject.id"
                                            v-bind:subject="subject"
                                            v-bind:schedule="studyProgram.schedule[subject.id]"
                                            v-bind:student-id="studentId"
                                            v-bind:assign-group-url="assignGroupUrl"
                                            v-bind:study-program-id="studyProgram.id"
                                            v-bind:name-prefix="`study_program[${studyProgram.id}][subject][additional]`"
                                            v-bind:specializations="specializations"
                                            v-bind:teachers="getTeachersForSubject(subject)"
                                            v-bind:teachersAccompanist="getTeachersAccompanist()"
                                            v-bind:groups="groups[studyProgram.id]"
                                            v-bind:readonly="readonly"
                                            v-bind:study-year="studyProgram.study_year"
                                            v-bind:without-links="withoutLinks"
                                            with-remove="true"
                                            editable="true"
                                            @removeSubject="removeSubject(studyProgram, subject)"
                                            @selectSpecialization="showSelectSpecializationPopup(subject, studyProgram, false)"
                    />
                </tbody>
            </table>
        </div>
        <show-popup popup="add-study-program-popup" v-if="!readonly">
            <a href="javascript:" class="button button-small button-link">
                <img svg-inline src="./../../svg/plus-icon.svg" class="icon" />
                <span>Додати навчальну програму</span>
            </a>
        </show-popup>
        <popup id="add-study-program-popup" title="Навчальні програми" tag-name="div" without-footer="true">
            <div class="popup-list">
                <div v-for="studyProgram in studyPrograms"
                     class="popup-list-item"
                     v-bind:class="{disabled: isStudyProgramSelected(studyProgram)}"
                     @click="addStudyProgram(studyProgram)">{{ studyProgram.name }}</div>
            </div>
        </popup>
        <popup managed="true"
               id="additional-subjects"
               title="Додаткові предмети"
               tag-name="div"
               without-footer="true"
               visible="true"
               @close="closeAdditionalSubjects()"
               v-if="isShowAdditionalSubjectsPopup"
        >
            <div class="popup-list">
                <div class="popup-list-item"
                     v-for="subject in currentStudyProgram.additional_subjects"
                     v-bind:class="{disabled: isAdditionalSubjectSelected(subject)}"
                     @click.prevent="addAdditionalSubject(subject)"
                    >{{ subject.name }}</div>
            </div>
        </popup>
        <popup managed="true"
               id="select-specialization"
               title="Обрати спеціалізацію"
               tag-name="div"
               without-footer="true"
               visible="true"
               @close="closeSpecializations()"
               v-if="showSpecializationsPopup"
        >
            <div class="popup-list">
                <div class="popup-list-item" v-for="specialization in specializations"
                     v-bind:class="{disabled: isDisabled(specialization)}"
                     @click.prevent="selectSpecialization(specialization)">{{  specialization.name }}</div>
            </div>
        </popup>
    </div>
</template>

<script>
import axios from 'axios'
import bus from './../bus'

export default {
    name: "StudentStudyPrograms",
    props: [
        'availableStudyPrograms',
        'studentPrograms',
        'studyProgramsUrl',
        'assignGroupUrl',
        'years',
        'groupsUrl',
        'studentId',
        'schoolSpecializations',
        'schoolTeachers',
        'teachersAccompanist',
        'readonly',
        'withoutLinks'
    ],
    data() {
        return {
            studyPrograms: [],
            currentPrograms: [],
            currentProgramsIds: [],
            currentProgramsWithYears: {},
            currentYear: 0,
            groups: {},
            specializations: [],
            teachers: [],

            showSpecializationsPopup: false,
            isShowAdditionalSubjectsPopup: false,

            currentSubject: null,
            currentStudyProgram: null,
            isSelectingPrimarySpecialization: true
        };
    },
    mounted() {
        if (typeof this.schoolSpecializations !== "undefined") {
            this.specializations = JSON.parse(this.schoolSpecializations)
                .map(item => {
                    const price = (item.real_price).toFixed();
                    return {...item, full_name: `${item.name} - ${price} грн`};
                });
        }

        if (typeof this.schoolTeachers !== "undefined") {
            this.teachers = JSON.parse(this.schoolTeachers);
        }

        if (typeof this.availableStudyPrograms !== "undefined") {
            this.studyPrograms = JSON.parse(this.availableStudyPrograms);
        }

        if (typeof this.studentPrograms !== "undefined") {
            this.currentProgramsWithYears = JSON.parse(this.studentPrograms);

            if (typeof this.availableStudyPrograms !== "undefined") {
                this.processSelected();
            }
        }

        if (typeof this.studyProgramsUrl !== "undefined") {
            axios.get(`${this.studyProgramsUrl}?student_id=${this.studentId}`)
                .then(response => response.data)
                .then(response => response.data)
                .then(response => this.studyPrograms = response)
                .then(() => this.processSelected())
            ;
        }

        this.currentYear = (new Date()).getFullYear();

        bus.$on('student::study-program::compact::change', (program) => this.updateFirstProgram(program));
        bus.$on('student::study-program::compact::change-year', (year) => this.updateFirstYear(year));
    },
    methods: {
        updateMainGroup(groupId, studyProgram) {
            for (let subject of studyProgram.subjects) {
                if (subject.type !== 'group') {
                    continue ;
                }

                subject.group_id = groupId;
            }

            for (let subject of studyProgram.attached_additional_subjects) {
                if (subject.type !== 'group') {
                    continue ;
                }

                subject.group_id = groupId;
            }

            studyProgram.main_group = groupId;
        },
        processSelected() {
            if (this.studyPrograms.length < 1) {
                return ;
            }

            const years = {};
            for (let index in this.currentProgramsWithYears) {
                years[index] = this.currentProgramsWithYears[index].year;
            }

            this.currentProgramsIds = Object.keys(this.currentProgramsWithYears)
                .map(i => Number(i));
            this.currentPrograms = this.currentProgramsIds
                .map(id => this.studyPrograms.find(p => p.id === id));

            for (let sp of this.currentPrograms) {
                sp.year = years[sp.id];
                sp.price = this.currentProgramsWithYears[sp.id].price;
                sp.lock = false;
                this.updateYear(sp.year, sp);
                bus.$emit('student::update-price', { id: sp.id, price: sp.price });
            }
        },
        isStudyProgramSelected(sp) {
            return this.currentProgramsIds.indexOf(sp.id) > -1;
        },
        addStudyProgram(sp) {
            if (this.isStudyProgramSelected(sp)) {
                return ;
            }

            sp.year = (new Date()).getFullYear();

            this.currentPrograms.push(sp);
            this.currentProgramsIds.push(sp.id);

            this.loadGroups(sp.year, sp);

            if (this.currentPrograms.length > 0) {
                const firstProgram = this.currentPrograms[0];
                bus.$emit('student::study-program::update', firstProgram);
            }
        },
        updateYear(year, sp) {
            sp.year = year;
            this.loadGroups(year, sp);

            if (this.currentPrograms.indexOf(sp) === 0) {
                bus.$emit('student::study-program::change-year', year);
            }
        },
        loadGroups(year, sp) {
            const index = this.currentPrograms.indexOf(sp);
            this.$set(this.currentPrograms[index], 'lock', true);

            return axios.get(`${this.groupsUrl}?year=${year}&study_program_id=${sp.id}`)
                .then(response => response.data)
                .then(response => {
                    this.$set(this.groups, sp.id, response);
                    this.$set(this.currentPrograms[index], 'lock', false);
                });
        },
        updateFirstProgram(program) {
            const programId = program.id;
            const year = program.year || (new Date()).getFullYear();

            if (this.currentPrograms.length < 1) {

                let currentProgramsWithYears = {  };
                currentProgramsWithYears[programId] = year;

                this.currentProgramsWithYears = currentProgramsWithYears;
                this.processSelected();
            } else {
                const index = this.currentPrograms.map(p => p.id)
                    .indexOf(programId);

                if (index < 0) {
                    const program = this.studyPrograms.find(p => p.id === programId);
                    if (program !== null && typeof program !== "undefined") {
                        program.lock = false;
                        program.year = year;
                    }

                    bus.$emit('student::update-price', { id: program.id, price: program.price });

                    this.$set(this.currentPrograms, '0', program);
                    this.$set(this.currentProgramsIds, '0', programId);
                    this.loadGroups(program.year, program);
                } else {
                    const item = this.currentPrograms.splice(index, 1);
                    this.currentPrograms.unshift(...item);
                    const price = this.currentPrograms[0].price;
                    const id = this.currentPrograms[0].id;

                    let object = { id, price };

                    bus.$emit('student::update-price', object);
                }
            }
        },
        updateFirstYear(year) {
            if (this.currentPrograms.length > 0) {
                const program = this.currentPrograms[0];
                program.year = year;

                this.$set(this.currentPrograms, '0', program);
                this.loadGroups(year, program);
            }
        },
        removeProgram(index) {
            this.currentPrograms.splice(index, 1);
            this.currentProgramsIds.splice(index, 1);

            bus.$emit('student::study-program::update', null);
        },
        showSelectSpecializationPopup(subject, studyProgram, isPrimary) {
            this.showSpecializationsPopup = true;
            this.currentSubject = subject;
            this.currentStudyProgram = studyProgram;
            this.isSelectingPrimarySpecialization = isPrimary;
        },
        closeSpecializations() {
            this.$set(this, 'showSpecializationsPopup', false);
            this.currentSubject = null;
            this.isSelectingPrimarySpecialization = false;
        },
        isDisabled(s) {
            return typeof this.currentSubject.instrument_id !== "undefined"
                && s.id === this.currentSubject.instrument_id;
        },
        selectSpecialization(s) {
            if (this.isSelectingPrimarySpecialization) {
                this.$set(this.currentStudyProgram, 'instrument_id', s.id);
            }
            this.$set(this.currentSubject, 'instrument_id', s.id);
            // this.recalculatePrice();
        },
        recalculatePrice() {
            const primarySpecializations = this.currentStudyProgram.subjects
                .filter(s => typeof s.instrument_id !== "undefined" && s.instrument_id !== null)
                .map(s => s.instrument_id);
            const additionalSpecializations = this.currentStudyProgram.additional_subjects
                .filter(s => this.currentStudyProgram.attached_additional_subjects.indexOf(s.id) > -1)
                .filter(s => typeof s.instrument_id !== "undefined" && s.instrument_id !== null)
                .map(s => s.instrument_id);
            const specializations = [...primarySpecializations, ...additionalSpecializations];

            const price = specializations
                .map(id => this.specializations.find(s => s.id === id))
                .map(s => s.real_price)
                .reduce((acc, item) => acc += item, 0);

            this.$set(this.currentStudyProgram, 'price', price * 100);
            bus.$emit('student::update-price', { id: this.currentStudyProgram.id, price: price * 100 });
        },
        getTeachersForSubject(subject) {
            if (typeof this.teachers === "undefined" || this.teachers === null) {
                return [];
            }

            if (!subject.is_with_specialization) {
                return this.teachers;
            }

            const teachers = this.teachers.filter(t => t.instruments_ids.indexOf(subject.instrument_id) > -1);

            return teachers;
        },
        getTeachersAccompanist() {
            if (typeof this.teachersAccompanist === "undefined" || this.teachersAccompanist === null) {
                return [];
            }

            // if (!subject.is_with_specialization) {
            //     return this.teachers;
            // }
            //
            // const teachers = this.teachers.filter(t => t.instruments_ids.indexOf(subject.instrument_id) > -1);

            return this.teachersAccompanist;
        },
        getAttachedAdditionalSubjects(sp) {
            return sp.additional_subjects
                .filter(p => sp.attached_additional_subjects.indexOf(p.id) > -1);
        },
        isAdditionalSubjectSelected(subject) {
            return this.currentStudyProgram.attached_additional_subjects.indexOf(subject.id) > -1;
        },
        addAdditionalSubject(subject) {
            this.currentStudyProgram.attached_additional_subjects.push(subject.id);
            if (typeof this.currentStudyProgram.schedule[subject.id] === "undefined") {
                const temp = [];
                for (let i = 0; i < this.currentStudyProgram.years; i++) {
                    temp.push({ pivot: { hours: 0 } });
                }

                this.currentStudyProgram.schedule[subject.id] = temp;
            }
            this.recalculatePrice();
        },
        closeAdditionalSubjects() {
            this.isShowAdditionalSubjectsPopup = false;
        },
        showAdditionalSubjectsPopup(program) {
            this.currentStudyProgram = program;
            this.isShowAdditionalSubjectsPopup = true;
        },
        removeSubject(sp, subject) {
            const id = subject.id;
            const index = sp.attached_additional_subjects.indexOf(id);
            sp.attached_additional_subjects.splice(index, 1);

            this.currentStudyProgram = sp;
            this.recalculatePrice();
            this.currentStudyProgram = null;

            this.$forceUpdate();
        }
    },
}
</script>

<style scoped>

</style>
