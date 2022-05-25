<template>
    <div v-bind:class="{'lock-loading': loading}">
        <custom-select :options="audiences || []"
                       :placeholder="placeholder"
                       :selected-by-default="selected"
                       id-key="id"
                       with-search="true"
                       value-key="name"
                       name="audience_id" />
    </div>
</template>

<script>
import bus from './../bus'
import axios from 'axios'

export default {
    name: "LessonAudience",
    props: [ 'event', 'selected', 'placeholder', 'default' ],
    data() {
        return {
            audiences: [],
            loading: false
        };
    },
    mounted() {
        if (typeof this.default !== "undefined") {
            this.audiences = JSON.parse(this.default);
        }

        if (typeof this.event !== "undefined") {
            bus.$on(this.event, (subjectId) => this.loadAudiences(subjectId));
        }
    },
    methods: {
        loadAudiences(subjectId) {
            if (subjectId === 0) {
                return ;
            }

            console.log(subjectId);
            this.loading = true;
            axios.get(`/api/subjects/${subjectId}/audiences`)
                .then(response => response.data)
                .then(response => this.audiences = response)
                .then(() => this.loading = false);
        }
    }
}
</script>

<style scoped>

</style>
