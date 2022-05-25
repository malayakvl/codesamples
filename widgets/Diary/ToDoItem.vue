<template>
    <div class="plan-info column" ref="plan-info">
        <form method="post" enctype="multipart/form-data">
        <div class="row">
            <div class="col-9">
                <div class="mt-2 mb-2 b-title fw-300">Опис зайняття {{planId}}</div>
                <div class="d-block fw-300 f-size-13">
                    <nl2br tag="span" :text="planInfo.plan ? planInfo.plan.description : ''" />
                </div>

                <div class="d-block">
                    <ul class="file-upload-list">
                        <li v-for="file in planInfo.descriptionFiles" class="uploaded">
                            <a :href="`/storage${file.path}`" target="_blank">{{file.original_name}}</a>
                        </li>
                    </ul>
                </div>
                <div class="mt-4 mb-2 b-title fw-300">Домашнє завдання</div>
                <div class="d-block fw-300 f-size-13">
                    <nl2br tag="span" :text="planInfo.plan ? planInfo.plan.homework : ''" />
                </div>
                <div class="d-block">
                    <ul class="file-upload-list">
                        <li v-for="file in filesHomeUploaded" class="uploaded">
                            <a :href="`/storage${file.path}`" target="_blank">{{file.original_name}}</a>
                        </li>
                    </ul>
                </div>
                <div class="d-block mt-4 mb-4" v-if="item.id === planId && lessonId">
                    <ToDoComments
                        :lessonId="lessonId"
                        :teacherId="teacherId"
                        :subjectId="subjectId"
                        :planId="planId"
                        :addCommentUrl="addCommentUrl"
                        :getCommentsUrl="getCommentsUrl"
                        :deleteCommentUrl="deleteCommentUrl"
                        :userId="userId"
                        :userStudent="userStudent"
                    />
                </div>
                <div class="mt-4 mb-2 b-title fw-300">Нотатки користувача</div>
                <div class="d-block fw-300 f-size-13">
                    <nl2br tag="span" :text="planInfo.notice ? planInfo.notice.notice : ''" />
                </div>
            </div>
            <div class="col-3">
                <div class="rate-lesson">
                    <span class="d-block caption fw-300">Ваша оцінка за урок</span>
                    <div class="rate" v-if="!isAbsent">{{lessonRate > 0 ? lessonRate : 'Немає оцінки'}}</div>
                    <div class="rate" v-if="isAbsent">Був відстутній</div>
                    <div class="avarage">{{averageRate}}</div>
                    <span class="d-block caption fw-300">середній бал по предмету</span>
                </div>
                <div class="alert alert-danger alert-messages-list offset-bottom-large" v-if="errors.length > 0">
                    <ul>
                        <li class="message" v-for="error in uploadErrors">{{ error }}</li>
                    </ul>
                </div>
                <ul class="file-upload-list">
                    <li v-for="file in filesStudent" class="uploaded">
                        <a :href="`/storage${file.path}`" target="_blank">{{file.original_name}}</a>
                        <span v-if="userStudent" @click="removeFile(file.fileId, 'student')" class="remove"  title="Видалити"><i class="fas fa-trash"></i></span>
                    </li>
                </ul>
                <div v-if="userStudent">
                    <label class="add-file btn-student-file">
                        Завантажити ДЗ
                        <input type="file" id="files" ref="files" multiple v-on:change="onChangeUpload()"/>
                    </label>
                    <div class="form-check done-lesson">
                        <input class="form-check-input" type="checkbox" @click="setDone()" v-model="isDone" id="isDone">
                        <label class="form-check-label" for="isDone">
                            Завдання виконано
                        </label>
                    </div>

                </div>
            </div>
        </div>
        </form>
    </div>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';
import Nl2br from 'vue-nl2br';
import ToDoComments from "./ToDoComments";

export default {
    components: {
        PerfectScrollbar,
        Nl2br,
        ToDoComments,
    },
    props: [
        'item',
        'lessonId',
        'subjectId',
        'teacherId',
        'planId',
        'event',
        'isClicked',
        'showUnconnected',

        'addCommentUrl',
        'getCommentsUrl',
        'deleteCommentUrl',
        'isDoneUrl',

        'addFilesUrl',
        'lessonPlanUrl',
        'fileRemoveUrl',
        'deleteInfoUrl',

        "userId",
        "userStudent"

    ],
    data() {
        return {
            errors: [],
            files: [],
            filesUploaded:[],
            filesHome: [],
            filesHomeUploaded: [],
            filesNoticeUploaded: [],
            filesNotice: [],
            filesStudent: [],
            fileSelected: false,
            currDescription: '',
            commentCnt: 0,
            currPlanHome: '',
            currPlanNotice: '',
            itemDescription: this.item.description,
            isConnected: false,
            planInfo: {},
            lessonRate: '',
            averageRate: '',
            isDone: false,
            isAbsent: false,

            uploadErrors: {},
            homeErrors: {},
            noticeErrors: {},
        }
    },
    mounted() {
        this.getInfo();
    },
    methods: {
        setDone() {
            axios.get(`${this.isDoneUrl}?eventId=${this.lessonId}&planId=${this.planId}&isDone=${!this.isDone ? 1 : 0}`)
                .then(response => response.data)
                .then(response => {
                    // this.commentList = response.comments;
                    // this.cntComments = response.comments.length;
                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        onChangeUpload(e) {
            for(let i=0;i<this.$refs.files.files.length;i++) {
                this.files.push(this.$refs.files.files[i]);
            }
            let formData = new FormData();
            formData.append('schoolId', this.schoolId);
            formData.append('eventId', this.lessonId);
            formData.append('planId', this.planId);
            formData.append('teacherId', this.teacherId);
            formData.append('subjectId', this.subjectId);
            formData.append('lessonId', this.item.id);
            formData.append('mainId', this.planInfo.plan.id);

            const  extensions = ['jpeg','jpg','png','gif','csv','txt','xlx','xlsx','pdf','zip','doc','docx','vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            const uploadErrors = {};
            for( let i = 0; i < this.files.length; i++ ){
                let file = this.files[i];
                const ext = this.files[i].type.split('/');
                if (!extensions.includes(ext[1]) || this.files[i].size > 10485760) {
                    uploadErrors[this.files[i].name] = 'Файл цього типу не дозволено, або розмір перевищує 10MB';
                }
                formData.append('files[' + i + ']', file);
            }
            this.uploadErrors = uploadErrors;
            const $this = this;
            if (Object.keys(uploadErrors).length === 0) {
                axios.post( this.addFilesUrl,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                ).then(function(response){
                    $this.errors = [];
                    if (response.data.success) {
                        $this.files = [];
                        $this.filesStudent = response.data.files;
                        // $this.filesUploaded = response.data.files;
                    } else {
                        const _errors = response.data.errors;
                        const errMessages = [];
                        errMessages.push('Дозволені лише jpeg,jpg,png,gif,csv,txt,xlx,xls,pdf,zip,doc,docx файли. Або перевищено ліміт розміру файлу')
                        $this.errors = errMessages;
                    }

                    document.body.classList.remove('lock-loading');
                })
                    .catch(function(response){
                        console.log('FAILURE!!', response.data);
                        document.body.classList.remove('lock-loading');
                    });
            }

        },
        getInfo() {
            this.planInfo = {};
            document.body.classList.add('lock-loading');
            axios.get(`${this.lessonPlanUrl}?lessonId=${this.lessonId}&planId=${this.planId}&subjectId=${this.subjectId}`)
                .then(response => response.data)
                .then(response => {
                    this.planInfo = response.data;
                    this.lessonRate = response.rate;
                    this.averageRate = response.average;
                    this.filesUploaded = response.data.descriptionFiles;
                    this.filesHomeUploaded = response.data.homeworkFiles;
                    this.filesNoticeUploaded = response.data.noticeFiles;
                    this.filesStudent = response.data.studentFiles;
                    this.isDone = response.isDone === 1;
                    this.isAbsent = response.isAbsent === 1;

                    document.body.classList.remove('lock-loading');
                })
                .catch((e) => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        },
        removeFile(fileId, type) {
            document.body.classList.add('lock-loading');
            axios.get(`${this.fileRemoveUrl}?id=${fileId}`)
                .then(response => {
                    this.filesStudent = [];
                    this.filesStudent = response.data.files;
                    document.body.classList.remove('lock-loading');
                })
                .catch(() => {
                    document.body.classList.remove('lock-loading');
                })
            ;
        }
    }
}
</script>
