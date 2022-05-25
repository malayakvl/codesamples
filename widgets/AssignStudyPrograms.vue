<template>
    <div>
        <div class="headline">
            <h1 class="headline-text">Навчальні програми</h1>
            <a href="javascript:" class="button button-large button-accent" @click.prevent="saveStudyPrograms()">
                <span>Зберегти</span>
            </a>
        </div>

        <form method="post" v-bind:action="saveUrl" class="card card-table offset-top-large offset-bottom-large form" ref="form">
            <input type="hidden" name="_token" v-bind:value="csrf">
            <div class="card-body">
                <table class="table study-programs-table">
                    <thead>
                    <tr>
                        <th class="checkbox-column">&nbsp;</th>
                        <th class="study-programs-table-name-column">Название</th>
                    </tr>
                    <tr>
                        <th class="id-column"></th>
                        <th class="study-programs-table-name-column">
                            <input type="text" class="input-component" v-model="filter" />
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="studyProgram in allStudyPrograms"
                        v-if="filter === null || studyProgram.name.toLowerCase().indexOf(filter.toLowerCase()) > -1"
                        @click.prevent="toggleAttached(studyProgram)"
                        class="row-with-action">
                        <td class="checkbox-column">
                            <div class="form-group form-group-checkbox">
                                <label>
                                    <input type="checkbox" value="1" v-bind:name="`studyProgram[${studyProgram.id}]`" v-model="studyProgram.attached" />
                                    <div class="checkbox-placeholder"></div>
                                </label>
                            </div>
                        </td>
                        <td class="subjects-table-name-column">{{ studyProgram.name }}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </form>

        <div class="headline">
            <h1 class="headline-text">Навчальні програми</h1>
            <a href="javascript:" class="button button-large button-accent" @click.prevent="saveStudyPrograms()">
                <span>Зберегти</span>
            </a>
        </div>
    </div>
</template>

<script>
export default {
    name: "AssignStudyPrograms",
    props: [ 'studyPrograms', 'saveUrl', 'csrf' ],
    data() {
        return {
            allStudyPrograms: [],
            filter: null
        };
    },
    mounted() {
        if (typeof this.studyPrograms !== "undefined") {
            this.allStudyPrograms = JSON.parse(this.studyPrograms);
        }
    },
    methods: {
        __(stringId) {
            return stringId;
        },
        saveStudyPrograms() {
            this.$refs.form.submit();
        },
        toggleAttached(sp) {
            sp.attached = !sp.attached;
        }
    }
}
</script>

<style scoped>

</style>
