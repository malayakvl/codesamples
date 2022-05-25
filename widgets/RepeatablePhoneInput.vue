<template>
    <div class="repeatable-phone-inputs">
        <div v-for="(item, index) in items" class="repeatable-phone offset-bottom-small">
            <phone-input :initial-value="item" :name="getName(index)" v-on:change="updateValue(index, $event)" />
            <div class="remove-phone" @click.prevent="remove(index, item)" v-if="index !== 0">
                <img svg-inline src="./../../svg/remove-icon.svg" class="icon" />
            </div>
        </div>
        <a href="javascript:" class="link link-bold link-uppercase with-icon" @click.prevent="addPhone()">
            <img svg-inline src="./../../svg/plus-icon.svg" class="icon" />
            <span>Додати</span>
        </a>
    </div>
</template>

<script>
export default {
    name: "RepeatablePhoneInput",
    props: [ 'name', 'value' ],
    data() {
        return {
            items: []
        }
    },
    mounted() {
        if (typeof this.value !== "undefined") {
            this.items = JSON.parse(this.value);
        }

        this.items = this.items.map(item => item === null ? '' : item);

        if (this.items.length < 1) {
            this.items.push('');
        }
    },
    methods: {
        addPhone() {
            this.items.push('');
        },
        remove(index, value) {
            this.items.splice(index, 1);
            console.log(this.items);
        },
        updateValue(index, value) {
            this.items[index] = value;
        },
        getName(index) {
            return `${this.name}[${index}]`;
        }
    }
}
</script>

<style scoped>

</style>
