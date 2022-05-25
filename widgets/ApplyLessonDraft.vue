<template>
    <div>
        <custom-select :options="availableDrafts"
                       :placeholder="placeholder"
                       :selected-by-default="selectedDraft"
                       v-on:change="update($event)"
                       id-key="id"
                       value-key="title"
                       name="lesson_draft_id"
                       with-search="true"
                       with-empty="true"
        />
    </div>
</template>

<script>
import bus from './../bus'

export default {
    name: "ApplyLessonDraft",
    props: [
        'drafts', 'placeholder', 'selectedDraft', 'eventPrefix', 'resetEvent'
    ],
    data() {
        return {
            availableDrafts: []
        };
    },
    mounted() {
        if (typeof this.drafts !== "undefined") {
            this.availableDrafts = JSON.parse(this.drafts);
        }

        if (typeof this.resetEvent !== "undefined") {
            bus.$on(this.resetEvent, () => {
                this.reset();
            });
        }
    },
    methods: {
        update(id) {
            const draft = this.availableDrafts.find(draft => draft.id === id);
            if (typeof draft === "undefined") {
                bus.$emit(`${this.eventPrefix}::subject`, 0);
                bus.$emit(`${this.eventPrefix}::group`, 0);
                bus.$emit(`${this.eventPrefix}::teachers`, 0);
                bus.$emit(`${this.eventPrefix}::student`, 0);
                bus.$emit(`${this.eventPrefix}::teacher-id`, 0);
                bus.$emit(`${this.eventPrefix}::subgroup`, 0);

                return ;
            }

            bus.$emit(`${this.eventPrefix}::subject`, draft.subject_id || -1);
            bus.$emit(`${this.eventPrefix}::group`, draft.group_id || -1);
            bus.$emit(`${this.eventPrefix}::teachers`, draft.teachers);
            bus.$emit(`${this.eventPrefix}::student`, draft.student_id || -1);
            bus.$emit(`${this.eventPrefix}::teacher-id`, draft.teacher_id);
            bus.$emit(`${this.eventPrefix}::subgroup`, -1);
        }
    }
}
</script>

<style scoped>

</style>
