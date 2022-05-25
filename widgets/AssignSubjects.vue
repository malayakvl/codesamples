<template>
    <div>
        <div class="headline">
            <h1 class="headline-text">Предмети</h1>
            <a href="javascript:" class="button button-large button-accent" @click.prevent="saveSubjects()">
                <span>Зберегти</span>
            </a>
        </div>

        <form method="post" v-bind:action="saveUrl" class="card card-table offset-top-large offset-bottom-large form" ref="form">
            <input type="hidden" name="_token" v-bind:value="csrf">
            <div class="card-body">
                <table class="table subjects-table">
                    <thead>
                    <tr>
                        <th class="checkbox-column">&nbsp;</th>
                        <th class="subjects-table-name-column">Название</th>
                    </tr>
                    <tr>
                        <th class="id-column"></th>
                        <th class="subjects-table-name-column">
                            <input type="text" class="input-component" v-model="filter" />
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="subject in allSubjects"
                        v-if="filter === null || subject.full_name.toLowerCase().indexOf(filter.toLowerCase()) > -1"
                        @click.prevent="toggleAttached(subject)"
                        class="row-with-action">
                        <td class="checkbox-column">
                            <div class="form-group form-group-checkbox">
                                <label>
                                    <input type="checkbox" value="1" v-bind:name="`subject[${subject.id}]`" v-model="subject.attached" />
                                    <div class="checkbox-placeholder"></div>
                                </label>
                            </div>
                        </td>
                        <td class="subjects-table-name-column">{{ subject.full_name }}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </form>

        <div class="headline">
            <h1 class="headline-text">Предмети</h1>
            <a href="javascript:" class="button button-large button-accent" @click.prevent="saveSubjects()">
                <span>Зберегти</span>
            </a>
        </div>
    </div>
</template>

<script>
export default {
    name: "AssignSubjects",
    props: [ 'subjects', 'saveUrl', 'csrf' ],
    data() {
        return {
            allSubjects: [],
            filter: null
        };
    },
    mounted() {
        if (typeof this.subjects !== "undefined") {
            this.allSubjects = JSON.parse(this.subjects);
        }
    },
    methods: {
        __(stringId) {
            return stringId;
        },
        saveSubjects() {
            this.$refs.form.submit();
        },
        toggleAttached(subject) {
            subject.attached = !subject.attached
        }
    }
}
</script>

<style scoped>

</style>
