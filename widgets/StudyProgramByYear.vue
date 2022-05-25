<template>
    <div>
        <table class="table study-program-subjects-table">
            <thead>
            <tr>
                <th class="subject-column">Предмет</th>
                <th v-for="year in years" class="with-input"><div class="text-center">{{ year }}</div></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="subject in subjects" v-bind:data-id="subject.id">
                <td class="subject-column with-floating-icon">
                    <span>{{ subject.full_name }}</span>
                    <img svg-inline src="./../../svg/remove-icon.svg"
                         class="icon remove-subject-icon"
                         @click="removeSubject(subject)" />
                </td>
                <td v-for="(year, index) in rowFor(subject)" class="with-input">
                    <input type="number"
                           @change="updateSubjectYear(subject, index, $event)"
                           v-bind:value="year"
                           v-bind:name="`subject[main][${subject.id}][${index}]`"
                           class="text-center"
                           step="0.01" />
                </td>
            </tr>
            </tbody>
            <thead v-if="additionalSubjects.length > 0">
            <tr>
                <th class="subject-column">Додатковий предмет</th>
                <th v-for="year in years" class="with-input no-border-top"><div class="text-center">{{ year }}</div></th>
            </tr>
            <tr>
                <th class="subject-column">Години</th>
                <th v-for="year in years" class="with-input">
                    <input type="number"
                           @change="updateAdditionalTotal(year, $event.target.value)"
                           v-bind:value="additionalTotal[year] || 0"
                           v-bind:name="`additional_total[${year}]`"
                           class="text-center"
                           step="0.01" />
                </th>
            </tr>
            </thead>
            <tbody v-if="additionalSubjects.length > 0">
            <tr v-for="subject in additionalSubjects" v-bind:data-id="subject.id">
                <td class="subject-column with-floating-icon">
                    <span>{{ subject.full_name }}</span>
                    <img svg-inline src="./../../svg/remove-icon.svg"
                         class="icon remove-subject-icon"
                         @click="removeSubject(subject, true)" />
                </td>
                <td v-for="(year, index) in rowFor(subject, true)" class="with-input">
                    <input type="number"
                           @change="updateSubjectYear(subject, index, $event, true)"
                           v-bind:value="year"
                           v-bind:name="`subject[additional][${subject.id}][${index}]`"
                           class="text-center"
                           step="0.01" />
                </td>
            </tr>
            </tbody>
            <tfoot>
            <tr>
                <td v-bind:colspan="years + 1" class="text-right table-insert-row">
                    <show-popup popup="hello-world">
                        <a href="javascript:" class="button button-small button-link button-no-icon-margin" @click="addAdditionalSubject()">
                            <img svg-inline src="./../../svg/plus-icon.svg" class="icon" />
                            <span class="offset-left-small">Додати додатковий предмет</span>
                        </a>
                    </show-popup><!--
                    --><show-popup popup="hello-world">
                        <a href="javascript:" class="button button-small button-link button-no-icon-margin offset-left-small" @click="addMainSubject()">
                            <img svg-inline src="./../../svg/plus-icon.svg" class="icon" />
                            <span class="offset-left-small">Додати предмет</span>
                        </a>
                    </show-popup>
                </td>
            </tr>
            </tfoot>
        </table>
        <popup id="hello-world" title="Предмети" tag-name="div" without-footer="true">
            <div class="popup-list">
                <div v-for="subject in schoolSubjects"
                     class="popup-list-item"
                     v-bind:class="{disabled: isSelected(subject)}"
                     @click="addSubject(subject)">{{ subject.full_name }}</div>
            </div>
        </popup>
    </div>
</template>

<script>
import lodash from 'lodash'
import bus from './../bus'

export default {
    name: "StudyProgramByYear",
    props: ['prefix', 'initialSchema', 'allowedSubjects', 'initialYears', 'initialAdditionalTotal', 'oldData'],
    data() {
        return {
            schema: [],
            years: 0,
            subjects: [],
            additionalSubjects: [],
            schoolSubjects: [],
            isAddingMainSubject: true,
            additionalTotal: {}
        };
    },
    mounted() {
        bus.$on(`${this.prefix}:years`, years => this.updateYears(years));
        bus.$on(`${this.prefix}:department`, school => this.loadDepartmentSubjects(school));

        this.schema = JSON.parse(this.initialSchema);
        if (typeof this.initialYears !== "undefined") {
            this.years = Number(this.initialYears);
        }

        if (typeof this.initialAdditionalTotal !== "undefined") {
            this.additionalTotal = JSON.parse(this.initialAdditionalTotal);
        }

        const pairs = this.schema.map(item => ({
            name: item.name,
            id: item.id,
            full_name: item.full_name,
            is_main: item.pivot.is_main
        }));
        const _subjects = {};

        for (let pair of pairs) {
            if (typeof _subjects[pair.id] !== "undefined") {
                continue ;
            }
            _subjects[pair.id] = pair;
        }

        const subjects = Object.values(_subjects);
        console.log(subjects);
        this.subjects = subjects.filter(s => s.is_main);
        this.additionalSubjects = subjects.filter(s => !s.is_main);

        const groups = lodash.groupBy(this.schema, 'name');
        this.schema = {};
        let years = 0;

        for (let key in groups) {
            const row = [];
            let id = 0;
            years = groups[key].length;

            for (let year of groups[key]) {
                id = year.id;
                row[year.pivot.year] = year.pivot.hours;
            }
            this.schema[id] = row.splice(1, row.length);
        }

        this.years = this.years !== years && years > 0 ? years : this.years;
        this.schoolSubjects = JSON.parse(this.allowedSubjects);
        this.rowFor(this.subjects[0]);

        if (typeof this.oldData !== "undefined") {
            const oldData = JSON.parse(this.oldData);
            for (let subject in oldData.main) {
                subject = Number(subject);
                const s = this.schoolSubjects.find(s => s.id === subject);
                this.subjects.push({
                    name: s.name,
                    full_name: s.full_name,
                    id: s.id,
                    is_main: true
                });

                this.schema[subject] = [];

                oldData.main[subject].forEach((item) => {
                    this.schema[subject].push(Number(item));
                });
            }
            for (let subject in oldData.additional) {
                subject = Number(subject);
                const s = this.schoolSubjects.find(s => s.id === subject);
                this.additionalSubjects.push({
                    name: s.name,
                    full_name: s.full_name,
                    id: s.id,
                    is_main: true
                });

                let temp = [];

                oldData.additional[subject].forEach((item) => {
                    temp.push(Number(item));
                });

                this.schema[subject] = temp;
            }
        }
    },
    methods: {
        updateYears(years) {
            this.years = years;
        },
        rowFor(subject, isAdditional = false) {
            if (typeof subject === "undefined") {
                return ;
            }

            if (typeof this.schema[subject.id] !== "undefined") {
                let row = this.schema[subject.id];
                if (row.length < this.years) {
                    for (let i = row.length; i < this.years; i++) {
                        row.push(0);
                    }
                } else if (row.length > this.years) {
                    row = lodash.clone(row).splice(0, this.years);
                }

                return row;
            }

            const row = [];
            for (let i = 0; i < this.years; i++) {
                row.push(0);
            }

            return row;
        },
        updateSubjectYear(subject, year, e, isAdditional = false) {
            const value = e.target.value;
            if (typeof this.schema[subject.id] === "undefined") {
                this.schema[subject.id] = this.rowFor(subject, isAdditional);
            }
            this.schema[subject.id][year] = Number(value);
        },
        prepare() {
            const schema = {};

            for (let subject of this.subjects) {
                schema[subject.id] = this.rowFor(subject)
            }

            for (let subject of this.additionalSubjects) {
                schema[subject.id] = this.rowFor(subject, true)
            }

            return schema;
        },
        isSelected(subject) {
            const isSelectedMain = this.subjects
                .filter(item => item.id === subject.id)
                .length > 0;
            const isSelectedAdditional = this.additionalSubjects
                .filter(item => item.id === subject.id)
                .length > 0;

            return isSelectedMain || isSelectedAdditional;
        },
        addSubject(subject) {
            if (!this.isSelected(subject)) {
                let newSubject = { id: subject.id, name: subject.name, full_name: subject.full_name };
                if (this.isAddingMainSubject) {
                    this.subjects.push(newSubject);
                } else {
                    this.additionalSubjects.push(newSubject);
                }
            }
        },
        removeSubject(subject, isAdditional = false) {
            if (!isAdditional) {
                this.subjects.splice(this.subjects.indexOf(subject), 1);
            } else {
                this.additionalSubjects.splice(this.additionalSubjects.indexOf(subject), 1);
            }

            this.schema = this.prepare();
        },
        loadDepartmentSubjects(id) {
            axios.get(`/api/subjects/department/${id}`)
                .then(response => response.data)
                .then(response => this.schoolSubjects = response.data)
                .then(() => {
                    this.subjects = [];
                    this.schema = this.prepare();
                })
            ;
        },
        addMainSubject() {
            this.isAddingMainSubject = true;
        },
        addAdditionalSubject() {
            this.isAddingMainSubject = false;
        },
        updateAdditionalTotal(year, value) {
            this.additionalTotal[year] = value;
        }
    }
}
</script>

<style scoped>
    .subject-column {
        width: 300px;
        box-sizing: border-box;
    }
    .table-insert-row {
        box-sizing: border-box;
        padding: 12px 23px;
        padding-right: 0;
    }
</style>
