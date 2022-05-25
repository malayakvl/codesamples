<template>
<popup is-form="true"
       managed="true"
       title="Наказ на відрахування"
       v-if="showPopup"
       v-bind:visible="showPopup"
       v-bind:action="expelledUrl"
       v-bind:method="'post'"
       v-bind:modal="true"
       @close="showPopup = false">
    <div class="form-group">
        <label>Дата</label>
        <input-datepicker name="order_date" placeholder="Дата" is-form-element="true" />
    </div>
    <upload-file name="order_file" label="Додати файл наказу" />
</popup>
</template>

<script>
import bus from './../bus'

export default {
    name: "AccountantExpelledStudentPopup",
    props: [ 'expelledUrl' ],
    data() {
        return {
            showPopup: false
        }
    },
    mounted() {
        bus.$on('expelled-student', (id) => this.expelleStudent(id));
    },
    methods: {
        expelleStudent(id) {
            this.showPopup = true;
        }
    }
}
</script>

<style scoped>

</style>
