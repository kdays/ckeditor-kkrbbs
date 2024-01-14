import AttachHelper from "../attach-helper";

class CkeditorUploadAdapter {
    constructor( loader ) {
        const defaults =  {
            maxSize: 0,
            apiUrl: "/attach/upload",
            uploadParams: {},
            allowExt: [],
            onUploaded: function(response) {

            }
        };

        this.loader = loader;
        this.index = 0;
        this.config = $.extend({}, defaults, window.uploadConfig || {});
    }

    get attachHelper() {
        console.info("getAttachHelper", window._attachHelper)
        return window._attachHelper || null;
    }

    // Starts the upload process.
    upload() {
        return this.loader.file
            .then( file => new Promise( ( resolve, reject ) => {
                if (this.config.maxSize > 0 && file.size > this.config.maxSize) {
                    return reject(file.name + ":文件大小过大");
                }

                let fileExt = file.name.split(".").pop().toLowerCase();
                if (!$.inArray(fileExt, this.config.allowExt)) {
                    return reject(file.name + ":不允许的格式");
                }

                console.info("check AttachHelper");
                if (this.attachHelper) {
                    try {
                        this.attachHelper.checkRules()
                    } catch (e) {
                        return reject(e.message);
                    }

                    this.index = this.attachHelper.initFile(file);
                    console.info("New index:" , this.index);
                }

                this._initRequest();
                this._initListeners( resolve, reject, file );
                this._sendRequest( file );
            } ) );
    }

    abort() {
        if ( this.xhr ) {
            this.xhr.abort();
        }
    }

    _initRequest() {
        const xhr = this.xhr = new XMLHttpRequest();
        xhr.open( 'POST', this.config.apiUrl, true );
        xhr.responseType = 'json';
        xhr.withCredentials = true;
    }

    _initListeners( resolve, reject, file ) {
        const index = this.index;
        const helper = this.attachHelper;
        const xhr = this.xhr;
        const loader = this.loader;
        const genericErrorText = `上传失败: ${ file.name }.`;

        xhr.addEventListener( 'error', () => function() {
            if (helper) helper.onError(xhr, genericErrorText, index);

            reject(genericErrorText);
        });
        xhr.addEventListener( 'abort', () => function() {
            if (helper) helper.onError(xhr, genericErrorText, index);

            reject();
        });
        xhr.addEventListener( 'load', () => {
            const response = xhr.response;
            console.info(response);

            if ( !response ) {
                if (helper) helper.onError(xhr, genericErrorText, index);
                return reject( genericErrorText );
            }

            if (response.msg && response.code !== 0) {
                if (helper) helper.onError(null, response.msg, index);
                return reject(response.msg)
            }

            if(this.config.onUploaded) this.config.onUploaded(response);
            if (helper) helper.onSuccess(response, index)

            resolve({
                urls: {
                    "default": response.data.url
                },
                upload_id: response.data.id,
                upload_size: response.data.size,
                upload_name: response.data.name
            })
        } );

        if ( xhr.upload ) {
            xhr.upload.addEventListener( 'progress', evt => {
                if (helper) helper.onUploading(xhr, evt, index);

                if ( evt.lengthComputable ) {
                    loader.uploadTotal = evt.total;
                    loader.uploaded = evt.loaded;
                }
            } );
        }
    }

    _sendRequest( file ) {
        const data = new FormData();

        for (const [key, value] of Object.entries(this.config.uploadParams)) {
            data.append(key, value);
        }
        data.append('upload', file);

        this.xhr.send(data);
    }
}

export default function CkEditorUploadAdapterPlugin(editor) {
    editor.plugins.get( 'FileRepository' ).createUploadAdapter = ( loader ) => {
        return new CkeditorUploadAdapter( loader );
    };

    editor.conversion.attributeToAttribute( { model: 'data-upload-id', view: 'data-upload-id' } );

    // 在image里
    const imageUploadEditing = editor.plugins.get( 'ImageUploadEditing' );
    imageUploadEditing.on( 'uploadComplete', ( evt, { data, imageElement } ) => {
        editor.model.change( writer => {
            writer.setAttribute('upload-id', data.upload_id, imageElement)
            writer.setAttribute('data-upload-id', data.upload_id, imageElement);
        } );
    } );
}