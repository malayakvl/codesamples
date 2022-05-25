<template>
    <div class="widget-lesson-teacher">
        <custom-select :options="options"
                       :placeholder="placeholder"
                       :selected-by-default="teacherId"
                       name="teacher_id"
                       id-key="id"
                       value-key="full_name"
                       with-search="true"
                       :update-by-event="`${eventPrefix}::teacher-id`"
        />
        <div class="suggestions">
            <a href="javascript:" v-for="suggestion in suggestions" class="suggestion link link-bold"
               @click="useSuggestion(suggestion)">{{ suggestion.full_name }}</a>
        </div>
    </div>
</template>

<script>
import bus from "../bus";

export default {
    name: "LessonTeacher",
    props: [ 'teachers', 'teacherId', 'eventPrefix', 'placeholder' ],
    data() {
        return {
            options: [],
            suggestions: []
        };
    },
    mounted() {
        if (typeof this.teachers !== "undefined") {
            this.options = JSON.parse(this.teachers);
        }

        if (typeof this.eventPrefix !== "undefined") {
            // bus.$on(`${this.eventPrefix}::subject`, (subjectId) => this.loadTeachers(subjectId));
            bus.$on(`${this.eventPrefix}::teachers`, (teachers) => this.suggestTeachers(teachers));
        }
    },
    methods: {
        suggestTeachers(teachers) {
            this.suggestions = teachers;
        },
        useSuggestion(suggestion) {
            bus.$emit(`${this.eventPrefix}::teacher-id`, suggestion.id);
        }
    }
}
</script>

<style scoped>

</style>
