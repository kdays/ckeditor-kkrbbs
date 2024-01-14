import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';

import "./ckeditor-attachment.scss";

export default class AttachmentPlugin extends Plugin {

    static get requires() {
        return [ Widget ];
    }

    init() {
        this._defineSchema()
        this._defineConverters()
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'attachment', {
            allowWhere: '$text',
            isBlock: true,
            isObject: true,
            isLimit: true,
            allowAttributesOf: '$root',
            allowAttributes: ['upload-id', 'filename']
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        /*
        function createAttachmentView(modelItem, viewWriter) {
            const name = modelItem.getAttribute( 'name' );

            const attachmentView = viewWriter.createContainerElement( 'span', {
                class: 'attachment',
                'upload-id': modelItem.getAttribute('upload-id'),
                'data-name': modelItem.getAttribute('data-name')
            }, {
                isAllowedInsideAttributeElement: true
            } );

            const innerText = viewWriter.createText(name);
            viewWriter.insert( viewWriter.createPositionAt( attachmentView, 0 ), innerText );

            return attachmentView;
        }*/

        conversion.for('downcast').elementToElement({
            model: 'attachment',
            view: (modelElement, conversionApi) => {
                const { writer } = conversionApi;

                return writer.createContainerElement('span', {
                    'data-filename': modelElement.getAttribute('filename'),
                    'upload-id': modelElement.getAttribute('upload-id'),
                    'class': 'editor-attachment'
                })
            }
        });

        conversion.for('upcast').elementToElement({
            view: {
                name: 'span',
                classes: 'editor-attachment'
            },

            model: (viewElement, conversionApi) => {
                const { writer } = conversionApi;

                return writer.createElement('attachment', {
                    'filename': viewElement.getAttribute('data-filename'),
                    'upload-id': viewElement.getAttribute('upload-id')
                })
            },

            converterPriority: 'high'
        })
    }

}
