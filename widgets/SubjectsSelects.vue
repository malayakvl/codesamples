<template>
    <div class="subjects-selects form-group">
        <div v-for="(subject, index) in current" class="offset-bottom-medium">
            <label v-if="index === 0 && typeof primaryLabel !== 'undefined'">{{ primaryLabel }}</label>
            <label v-if="index === 1 && typeof secondaryLabel !== 'undefined'">{{ secondaryLabel }}</label>
            <custom-select :options="available"
                           :value-key="valueKey"
                           :id-key="idKey"
                           disabled-key="used"
                           :placeholder="placeholder"
                           :selected-by-default="subject.id || -1"
                           v-bind:name="getName(index)"
                           with-search="true"
                           v-on:change="handleChange($event, index)"
            />
            <a v-if="index >= 1 && typeof secondaryLabel !== 'undefined'"
               href="javascript:"
               class="link link-bold link-uppercase with-icon"
               @click="removeSubject(index)">
<!--                <img svg-inline src="./../../svg/minus-icon.svg" class="icon" />-->
                <span>Видалити</span>
            </a>
        </div>


        <a href="javascript:" class="link link-bold link-uppercase with-icon" @click="addSubject()">
            <img svg-inline src="./../../svg/plus-icon.svg" class="icon" />
            <span>{{ addLabel }}</span>
        </a>
    </div>
</template>

<script>
import lodash from 'lodash'

export default {
    name: "RepeatableSelect",
    props: [ 'selectedItems', 'options', 'name', 'primaryLabel', 'secondaryLabel', 'addLabel', 'placeholder', 'idKey', 'valueKey' ],
    data() {
        return {
            current: [],
            available: [],
            selected: []
        };
    },
    mounted() {
        this.current = JSON.parse(this.selectedItems).map(item => {
            if (isNaN(item)) {
                return item;
            } else {
                const temp = {};
                temp[this.idKey] = Number(item);
                return temp;
            }
        });
        this.available = JSON.parse(this.options);
        this.selected = this.current.map(item => item[this.idKey]);

        this.available.unshift({ id: 0, name: '  ', disabled: false });

        this.$nextTick(() => this.updateDisabled());
    },
    methods: {
        testing() {
            this.available.push({});
        },
        handleChange(id, index) {
            if (id === 0) {
                this.$nextTick(() => {
                    this.current.splice(index, 1);
                    this.selected.splice(index, 1);
                });
            } else {
                this.selected[index] = id;
            }

            this.updateDisabled();
        },
        availableSubjectsCopy() {
            return lodash.clone(this.available);
        },
        updateDisabled() {
            this.available = this.available.map(item => ({
                ...item, used: this.selected.indexOf(item.id) > -1
            }));
        },
        removeSubject(index) {
            const tmpCurrent = this.current;
            this.current.splice(this.current.indexOf(index), 1);
        },
        addSubject() {
            this.current.push({});
        },
        getName(index) {
            return `${this.name}[${index}]`;
        }
    }
}
</script>

<style scoped>

</style>
