<template>
    <div class="comment-block">
        <span class="section-title">Коментарі  {{ cntComments }}</span>
        <div class="comment-data column" v-for="item in commentList" v-bind:id="`comment-${item.id}`">
            <div class="row">
                <div class="col-8">
                    <span>{{ getDateFormat(item.created_at) }}</span>
                    {{item.description}}
                </div>
                <div class="col-4">
                    <em class="float-right">
                        {{ item.userName }}<br/>
                        <a href="javascript:;" @click="removeComment(item.id)" title="Видалити"><i class="fas fa-trash-alt"></i></a>
                    </em>
                </div>
            </div>
        </div>
        <form v-show="formVisibility" class="form columns add-plan-form"  method="post">
            <div class="column">
                <div class="form-group offset-bottom-large">
                    <textarea
                        type="text"
                        id="commentDescription"
                        name="commentDescription"
                        class="input-component"
                        autocomplete="off"
                        v-model="commentDescription"
                    />
                </div>
            </div>
            <div class="column">
                <button type="button" @click="cancelComment" class="button button-accent button-default button-small btn-white">
                    Відмінити
                </button>
                <button type="button" @click="submitComment"  class="button button-accent button-default button-small btn-purple">
                    Зберегти
                </button>
            </div>

        </form>
        <a v-show="!formVisibility" href="javascript:;" v-on:click="addComment" class="button button-default button-small btn-white">Додати коментар</a>

    </div>
</template>

<script>
import moment from 'moment';
export default {
    components: {
    },
    props: [
        'lessonId',
        'teacherId',
        'planId',
        'subjectId',

        'addCommentUrl',
        'getCommentsUrl',
        'deleteCommentUrl'
    ],
    data() {
        return {
            commentList: [],
            cntComments: 0,
            commentDescription: '',
            formVisibility: false
        }
    },
    watch: {
        lessonId: function(newLessonId) {
        }
    },
    computed: {

    },
    mounted() {
        // need to get list of comments
        this.getComments();
    },
    methods: {
        addComment() {
            this.formVisibility = !this.formVisibility;
        },
        removeComment(commentId) {
            axios.delete(`${this.deleteCommentUrl}?id=${commentId}`)
                .then(response => response.data)
                .then(response => {
                    // this.commentList = response.comments;
                    // this.formVisibility = false;
                    // this.commentDescription = '';
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
            this.getComments();
        },
        submitComment() {
            const toDoComent = {
                planId: this.planId,
                subjectId: this.subjectId,
                lessonId: this.lessonId,
                comment: this.commentDescription
            }
            document.body.classList.add('lock-loading');
            axios.post(this.addCommentUrl, { toDoComent })
                .then(response => response.data)
                .then(response => {
                    this.commentList = response.comments;
                    this.formVisibility = false;
                    this.commentDescription = '';
                    this.cntComments = response.comments.length;
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        getComments() {
            document.body.classList.add('lock-loading');
            axios.get(`${this.getCommentsUrl}?lessonId=${this.lessonId}&planId=${this.planId}&subjectId=${this.subjectId}`)
                .then(response => response.data)
                .then(response => {
                    this.commentList = response.comments;
                    this.cntComments = response.comments.length;
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        cancelComment() {
            this.formVisibility = false;
        },
        getDateFormat(date) {
            return moment(date).locale('uk').format('DD MMM, Y');
        },
    }
}
</script>
