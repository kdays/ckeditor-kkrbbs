export default class CkeditorUploadAttrs {
    /**
     * Plugin's constructor - receives an editor instance on creation.
     */
    constructor( editor ) {
        // Save reference to the editor.
        this.editor = editor;
    }

    /**
     * Sets the conversion up and extends the table & image features schema.
     *
     * Schema extending must be done in the "afterInit()" call because plugins define their schema in "init()".
     */
    afterInit() {
        const editor = this.editor;

        setupCustomAttributeConversion( 'img', 'imageBlock', 'upload-id', editor );
        setupCustomAttributeConversion( 'img', 'imageInline', 'upload-id', editor );
    }
}

/**
 * Returns the custom attribute upcast converter.
 */
function upcastAttribute( viewElementName, viewAttribute, modelAttribute ) {
    return dispatcher => dispatcher.on( `element:${ viewElementName }`, ( evt, data, conversionApi ) => {
        const viewItem = data.viewItem;
        const modelRange = data.modelRange;

        const modelElement = modelRange && modelRange.start.nodeAfter;

        if ( !modelElement ) {
            return;
        }

        conversionApi.writer.setAttribute( modelAttribute, viewItem.getAttribute( viewAttribute ), modelElement );
    } );
}

/**
 * Returns the custom attribute downcast converter.
 */
function downcastAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute ) {
    return dispatcher => dispatcher.on( `insert:${ modelElementName }`, ( evt, data, conversionApi ) => {
        const modelElement = data.item;

        const viewFigure = conversionApi.mapper.toViewElement( modelElement );
        const viewElement = findViewChild( viewFigure, viewElementName, conversionApi );

        if ( !viewElement ) {
            return;
        }

        conversionApi.writer.setAttribute( viewAttribute, modelElement.getAttribute( modelAttribute ), viewElement );
    } );
}

function findViewChild( viewElement, viewElementName, conversionApi ) {
    const viewChildren = Array.from( conversionApi.writer.createRangeIn( viewElement ).getItems() );

    return viewChildren.find( item => item.is( 'element', viewElementName ) );
}

/**
 * Sets up a conversion for a custom attribute on the view elements contained inside a <figure>.
 *
 * This method:
 * - Adds proper schema rules.
 * - Adds an upcast converter.
 * - Adds a downcast converter.
 */
function setupCustomAttributeConversion( viewElementName, modelElementName, viewAttribute, editor ) {
    // Extends the schema to store an attribute in the model.
    const modelAttribute = `data-${ viewAttribute }`;

    editor.model.schema.extend( modelElementName, { allowAttributes: [ modelAttribute ] } );

    editor.conversion.for( 'upcast' ).add( upcastAttribute( viewElementName, viewAttribute, modelAttribute ) );
    editor.conversion.for( 'downcast' ).add( downcastAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute ) );

}