
import { Plugin } from 'ckeditor5/src/core';
import { Typing } from 'ckeditor5/src/typing';
import { createDropdown } from 'ckeditor5/src/ui';
import { CKEditorError } from 'ckeditor5/src/utils';

import EmotionNavigationView from './ui/emotionnavigationview';
import EmotionGridView from './ui/emotiongridview';
import EmotionPaginationView from './ui/emotionpaginationview';
import Command from '@ckeditor/ckeditor5-core/src/command';

import "./ui/style.scss"

const emotionIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"/></svg>`

export default class Emotions extends Plugin {

    static get requires() {
        return [Typing]
    }

    static get pluginName() {
        return 'Emotions';
    }

    constructor(editor) {
        super( editor );

        this._emotions = new Map();
        this._groups = new Map();
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register('emotion', {
            isImage: true,
            isInline: true,
            allowWhere: '$text',
            allowAttributes: ['url', 'emotion-id']
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        conversion.for('downcast').elementToElement({
            model: 'emotion',
            view: (modelElement, conversionApi) => {
                const { writer } = conversionApi;

                return writer.createContainerElement('img', {
                    'src': modelElement.getAttribute('url'),
                    'emotion-id': modelElement.getAttribute('emotion-id'),
                    'class': 'emotion'
                })
            }
        });

        conversion.for('upcast').elementToElement({
            view: {
                name: 'img',
                classes: 'emotion'
            },

            model: (viewElement, conversionApi) => {
                const { writer } = conversionApi;

                return writer.createElement('emotion', {
                    url: viewElement.getAttribute('src'),
                    'emotion-id': viewElement.getAttribute('emotion-id')
                })
            },

            converterPriority: 'high'
        })
    }

    init() {
        const editor = this.editor;
        const t = editor.t;

        this._defineSchema();
        this._defineConverters();

        editor.commands.add('insertEmotion', new InsertEmotionCommand(editor));

        editor.ui.componentFactory.add( 'emotions', locale => {
            const dropdownView = createDropdown( locale );
            let dropdownPanelContent;

            dropdownView.buttonView.set( {
                label: t( '表情' ),
                tooltip: true,
                icon: emotionIcon
            } );

            dropdownView.bind( 'isEnabled' ).to( editor.commands.get('insertEmotion') );

            // Insert a special character when a tile was clicked.
            dropdownView.on( 'execute', ( evt, data ) => {
                console.info(data);
                editor.execute('insertEmotion', {'id': data.id, 'url': data.url})
            } );

            dropdownView.on( 'change:isOpen', () => {
                if ( !dropdownPanelContent ) {
                    dropdownPanelContent = this._createDropdownPanelContent( locale, dropdownView );

                    dropdownView.panelView.children.add( dropdownPanelContent.navigationView );
                    dropdownView.panelView.children.add( dropdownPanelContent.gridView );
                    dropdownView.panelView.children.add( dropdownPanelContent.paginationView );
                }

                dropdownPanelContent.paginationView.set( {
                    page: 1,
                    totalPage: 1
                } );
            } );

            return dropdownView;
        } );
    }

    addItems( groupName, items ) {
        const group = this._getGroup( groupName );

        for ( const item of items ) {
            group.add( item.id );
            this._emotions.set( item.id, item.url );
        }
    }

    /**
     * Returns an iterator of special characters groups.
     *
     * @returns {Iterable.<String>}
     */
    getGroups() {
        return this._groups.keys();
    }

    /**
     * Returns a collection of special characters symbol names (titles).
     *
     * @param {String} groupName
     * @returns {Set.<String>|undefined}
     */
    getEmotionsForGroup( groupName ) {
        return this._groups.get( groupName );
    }

    /**
     * Returns the symbol of a special character for the specified name. If the special character could not be found, `undefined`
     * is returned.
     *
     * @param {String} title The title of a special character.
     * @returns {String|undefined}
     */
    getEmotion( title ) {
        return this._emotions.get( title );
    }

    /**
     * Returns a group of special characters. If the group with the specified name does not exist, it will be created.
     *
     * @private
     * @param {String} groupName The name of the group to create.
     */
    _getGroup( groupName ) {
        if ( !this._groups.has( groupName ) ) {
            this._groups.set( groupName, new Set() );
        }

        return this._groups.get( groupName );
    }

    /**
     * Updates the symbol grid depending on the currently selected character group.
     *
     * @private
     */
    _updateGrid( currentGroupName, paginationView, gridView, page = 1 ) {
        // Updating the grid starts with removing all tiles belonging to the old group.
        gridView.tiles.clear();

        const characterTitles = this.getEmotionsForGroup( currentGroupName );
        let size = 10, skip = (page - 1) * size + 1, count = 0,
            total =  Math.ceil(characterTitles.size / size);

        for ( const title of characterTitles ) {
            count++;
            if (count >= skip + size || count < skip) {
                continue;
            }
            const character = this.getEmotion( title );

            gridView.tiles.add( gridView.createTile( character, title ) );

        }

        this._updatePagination(paginationView, page, total);
    }

    _updatePagination( paginationView, nowPage, maxPage ) {
        paginationView.page = nowPage
        paginationView.totalPage = maxPage;

        paginationView.updatePage(nowPage, maxPage)
    }

    /**
     * Initializes the dropdown, used for lazy loading.
     *
     * @private
     * @returns {Object} Returns an object with `navigationView`, `gridView` and `infoView` properties, containing UI parts.
     */
    _createDropdownPanelContent( locale, dropdownView ) {
        const specialCharsGroups = [ ...this.getGroups() ];

        const navigationView = new EmotionNavigationView( locale, specialCharsGroups );
        const gridView = new EmotionGridView( locale );
        const paginationView = new EmotionPaginationView( locale );

        gridView.delegate( 'execute' ).to( dropdownView );

        /*
        gridView.on( 'tileHover', ( evt, data ) => {
            infoView.set( data );
        } );*/

        // Update the grid of special characters when a user changed the character group.
        navigationView.on( 'execute', () => {
            this._updateGrid( navigationView.currentGroupName, paginationView, gridView );
        } );

        paginationView.on('execute', (evt, data) => {
            this._updateGrid( navigationView.currentGroupName, paginationView, gridView, data.page );
        })

        // Set the initial content of the special characters grid.
        this._updateGrid( navigationView.currentGroupName, paginationView, gridView );

        return { navigationView, gridView, paginationView };
    }
}


class InsertEmotionCommand extends Command {
    execute(options) {
        this.editor.model.change( writer => {
            const editor = this.editor;
            const selection = editor.model.document.selection;

            editor.model.change( writer => {
                const emotion = writer.createElement('emotion', {
                    "emotion-id": options.id,
                    url: options.url
                } );

                // ... and insert it into the document.
                editor.model.insertContent( emotion );
            } );
        } );
    }

    refresh() {
       // const model = this.editor.model;
       // const selection = model.document.selection;
       // this.isEnabled = model.schema.checkChild(selection.focus.parent, 'emotion');
        this.isEnabled = true;
    }
}