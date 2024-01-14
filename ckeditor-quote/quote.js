import { Plugin, icons } from 'ckeditor5/src/core';
import { Typing } from 'ckeditor5/src/typing';
import { Enter } from 'ckeditor5/src/enter';
import { Delete } from 'ckeditor5/src/typing';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import InsertQuoteCommand from './insertquotecommand';

export default class Quote extends Plugin {

    static get requires() {
        return [Typing, Widget, Enter, Delete]
    }

    static get pluginName() {
        return 'Quote';
    }

    constructor(editor) {
        super(editor);
    }

    _defineSchema() {
        const schema = this.editor.model.schema;
        schema.register( 'blockQuote', {
            allowWhere: '$block',
            allowContentOf: '$root',
            allowAttributes: ['data-from', 'data-floor']
        } );


        schema.addChildCheck( ( context, childDefinition ) => {
            if ( context.endsWith( 'blockQuote' ) && childDefinition.name === 'blockQuote' ) {
                return false;
            }
        } );
    }

    _defineConverters() {
        const conversion = this.editor.conversion;
        const editor = this.editor;

        conversion.for('downcast').elementToElement({
            model: 'blockQuote',
            view: (modelElement, conversionApi) => {
                const { writer } = conversionApi;

                let floor = modelElement.getAttribute('data-floor')
                let from = modelElement.getAttribute('data-from');

                if (from !== undefined) {
                    return writer.createEditableElement('blockquote', {
                        'data-from': from,
                        'data-floor': floor,
                        'class': 'quote exists-quote'
                    });
                }

                return writer.createEditableElement('blockquote', {
                    'class': 'quote no-from-quote'
                });
            }
        });

        conversion.for('upcast').elementToElement({
            view: {
                name: 'blockquote',
                classes: 'quote'
            },

            model: (viewElement, conversionApi) => {
                const { writer } = conversionApi;

                let from = viewElement.getAttribute('data-from');
                let floor = viewElement.getAttribute('data-floor');

                if (from !== undefined) {
                    return writer.createElement('blockQuote', {
                        'data-from': from,
                        'data-floor': floor
                    })
                }

                return writer.createElement("blockQuote", {});
            }
        })

        //editor.conversion.elementToElement( { model: 'blockQuote', view: 'blockquote' } );
    }

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add('insertQuote', new InsertQuoteCommand(this.editor));
        this._initUI();
        this._addPostCheck()
    }

    _initUI() {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add( 'quote', locale => {
            // The state of the button will be bound to the widget command.
            const command = editor.commands.get( 'insertQuote' );

            // The button will be an instance of ButtonView.
            const buttonView = new ButtonView( locale );

            buttonView.set( {
                // The t() function helps localize the editor. All strings enclosed in t() can be
                // translated and change when the language of the editor changes.
                label: t( '引用' ),
                tooltip: true,
                icon: icons.quote
            } );

            // Bind the state of the button to the command.
            buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

            // Execute the command when the button is clicked (executed).
            this.listenTo( buttonView, 'execute', () => {
                editor.execute( 'insertQuote' );
                editor.editing.view.focus();
            } );

            return buttonView;
        } );
    }

    _addPostCheck() {
        const editor = this.editor;
        const schema = this.editor.model.schema;

        editor.model.document.registerPostFixer( writer => {
            const changes = editor.model.document.differ.getChanges();

            for ( const entry of changes ) {
                if ( entry.type == 'insert' ) {
                    const element = entry.position.nodeAfter;

                    if ( !element ) {
                        // We are inside a text node.
                        continue;
                    }

                    if ( element.is( 'element', 'blockQuote' ) && element.isEmpty ) {
                        // Added an empty blockQuote - remove it.
                        writer.remove( element );

                        return true;
                    } else if ( element.is( 'element', 'blockQuote' ) && !schema.checkChild( entry.position, element ) ) {
                        // Added a blockQuote in incorrect place. Unwrap it so the content inside is not lost.
                        writer.unwrap( element );

                        return true;
                    } else if ( element.is( 'element' ) ) {
                        // Just added an element. Check that all children meet the scheme rules.
                        const range = writer.createRangeIn( element );

                        for ( const child of range.getItems() ) {
                            if (
                                child.is( 'element', 'blockQuote' ) &&
                                !schema.checkChild( writer.createPositionBefore( child ), child )
                            ) {
                                writer.unwrap( child );

                                return true;
                            }
                        }
                    }
                } else if ( entry.type == 'remove' ) {
                    const parent = entry.position.parent;

                    if ( parent.is( 'element', 'blockQuote' ) && parent.isEmpty ) {
                        // Something got removed and now blockQuote is empty. Remove the blockQuote as well.
                        writer.remove( parent );

                        return true;
                    }
                }
            }

            return false;
        } );
    }

}
