<template>
    <form class="form columns add-plan-form"  method="post">
        <h2>Додати план</h2>
        <div class="alert alert-danger alert-messages-list offset-bottom-large" v-if="errors.length > 0">
            <ul>
                <li class="message" v-for="error in errors">{{ error }}</li>
            </ul>
        </div>

        <div class="column">
            <div class="form-group offset-bottom-large">
                <label>
                    Предмет
                </label>
                <v-select
                    v-model="planSubject"
                    :options="listSubject"
                    label="name"
                />
            </div>

            <div class="form-group offset-bottom-large">
                <label for="planTitle">
                    Найменування
                </label>
                <input
                    type="text"
                    id="planTitle"
                    name="planTitle"
                    class="input-component"
                    autocomplete="off"
                    v-model="planTitle"
                />
            </div>
            <div class="form-group offset-bottom-large">
                <label for="planDescription">
                    Опис
                </label>
                <textarea
                    type="text"
                    id="planDescription"
                    name="planDescription"
                    class="input-component"
                    autocomplete="off"
                    v-model="planDescription"
                />
            </div>
        </div>
        <button type="button" @click="onSubmit" class="button button-accent button-default button-medium btn-purple">
            Зберегти
        </button>
    </form>
</template>
<script>
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css';

export default {
    components: {
        'v-select': vSelect
    },
    props: [
        'subjects',
        'subjectId'
    ],
    data() {
        return {
            planTitle: "",
            planDescription: "",
            planSubject: [{ name: "Всі заняття", id: '' }],
            listSubject: [],
            errors: []
        };
    },
    watch: {
        subjectId: function(oldSubjectId, newSubjectId) {
            const subjSelected = this.listSubject.find(subject => subject.id === this.subjectId);
            if (subjSelected) {
                this.planSubject = subjSelected;
            }

        }
    },
    mounted() {
        const emptyList = [{ name: "Всі заняття", id: '' }];
        this.listSubject = [...emptyList, ...JSON.parse(this.subjects.schoolSubjects)];
    },
    methods: {
        onSubmit() {
            this.errors = [];
            document.body.classList.add('lock-loading');
            if (!this.planSubject.id) {
                this.errors.push('Оберіть предмет');
            }
            if (this.planTitle === "") {
                this.errors.push('Додайте Найменування');
            }
            if (this.errors.length > 0) {
                document.body.classList.remove('lock-loading');
                return;
            }
            this.$emit('todo-added', {
                title: this.planTitle,
                description: this.planDescription,
                subjectId: this.planSubject.id
            });
            this.planTitle = "";
            this.planDescription = "";
            this.planSubject = [{ name: "Всі заняття", id: '' }];
        },
    },
}
</script>
