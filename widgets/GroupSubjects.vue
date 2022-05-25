<template>
    <div>
        <h3 class="offset-bottom-small">Предмети</h3>
        <div class="columns four-columns" v-bind:class="{'lock-loading': isLoading}" v-if="studyProgram !== null">
            <div class="column" v-for="subject in studyProgram.subjects">
                <div class="form-group">
                    <label>{{ subject.full_name }}</label>
                    <div>
                        <custom-select :options="teachers"
                                       id-key="id"
                                       value-key="full_name"
                                       :selected-by-default="draftOrLoaded(subject)"
                                       :placeholder="subject.full_name"
                                       with-search="true"
                                       :name="`subjects[${subject.id}][teacher_id]`"
                                       show-selected="false"
                                       show-selected-badge="true"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import bus from './../bus'
import axios from 'axios'

export default {
    name: "GroupSubjects",
    props: [ 'event', 'studyProgramId', 'teachers', 'drafts' ],
    data() {
        return {
            programId: -1,
            studyProgram: null,
            isLoading: false,
            _drafts: []
        }
    },
    mounted() {
        bus.$on(this.event, (studyProgramId) => this.loadStudyProgram(studyProgramId));

        if (typeof this.studyProgramId !== "undefined") {
            this.loadStudyProgram(Number(this.studyProgramId));
        }

        if (typeof this.drafts !== "undefined") {
            let temp = JSON.parse(this.drafts);
            for (let key in temp) {
                if (isNaN(temp[key])) {
                    temp[key] = Number(temp[key].teacher_id);
                }
            }
            this._drafts = temp;
        }
    },
    methods: {
        loadStudyProgram(id) {
            if (id < 1) {
                return ;
            }

            this.programId = id;
            this.isLoading = true;

            axios.get(`/api/study-programs/${id}?only-teacher-ids`)
                .then(response => response.data)
                .then(response => this.studyProgram = response)
                .then(() => this.isLoading = false)
            ;
        },
        draftOrLoaded(subject) {
            return typeof this._drafts[subject.id] !== "undefined"
                ? this._drafts[subject.id]
                : subject.teachers;
        }
    }
}
</script>

<style scoped>

</style>
