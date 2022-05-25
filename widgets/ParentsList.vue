<template>
    <div>
        <div v-for="(item, index) in items" v-bind:class="{'offset-bottom-medium': index !== items.length - 1}">
            <div class="form-group">
                <label>{{ fullNameLabel }}</label>
                <input type="text" class="input-component" v-model="item.full_name" v-bind:name="getName(index, 'full_name')" />
            </div>
            <div class="form-group">
                <label>{{ rfidLabel }}</label>
                <input type="text" class="input-component" v-model="item.rfid" v-bind:name="getName(index, 'rfid')" />
            </div>
            <div class="form-group">
                <label>{{ phoneNumberLabel }}</label>
                <phone-input v-bind:name="getName(index, 'phone_number')" v-bind:initial-value="item.phone_number" />
            </div>
            <div class="form-group">
                <label>{{ commentLabel }}</label>
                <input type="text" class="input-component" v-model="item.comment" v-bind:name="getName(index, 'comment')" />
            </div>
        </div>
        <a href="javascript:" class="link link-bold link-uppercase with-icon offset-top-medium" @click.prevent="addParent()">
            <img svg-inline src="./../../svg/plus-icon.svg" />
            <span>{{ addLabel }}</span>
        </a>
    </div>
</template>

<script>
export default {
    name: "ParentsList",
    props: [ 'name', 'addLabel', 'parents', 'fullNameLabel', 'rfidLabel', 'phoneNumberLabel', 'commentLabel' ],
    data() {
        return {
            items: []
        };
    },
    mounted() {
        if (typeof this.parents !== "undefined") {
            this.items = JSON.parse(this.parents);
            this.items = this.items.map(item => ({...item, phone_number: item.phone_number === null ? '' : item.phone_number}));
        }
    },
    methods: {
        getName(index, field) {
            return `${this.name}[${index}][${field}]`;
        },
        addParent() {
            this.items.push({ full_name: '', rfid: '', phone_number: '', comment: '' });
        }
    }
}
</script>

<style scoped>

</style>
