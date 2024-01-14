import { Collection } from 'ckeditor5/src/utils';
import { Model, FormHeaderView, createDropdown, addListToDropdown } from 'ckeditor5/src/ui';

/**
 * A class representing the navigation part of the special characters UI. It is responsible
 * for describing the feature and allowing the user to select a particular character group.
 *
 */
export default class EmotionNavigationView extends FormHeaderView {

    constructor( locale, groupNames ) {
        super( locale );

        const t = locale.t;

        this.set( 'class', 'ck-emotion-navigation' );

        this.groupDropdownView = this._createGroupDropdown( groupNames );
        this.groupDropdownView.panelPosition = locale.uiLanguageDirection === 'rtl' ? 'se' : 'sw';

        this.label = t( '表情' );
        this.children.add( this.groupDropdownView );
    }

    /**
     * Returns the name of the character group currently selected in the {@link #groupDropdownView}.
     *
     * @type {String}
     */
    get currentGroupName() {
        return this.groupDropdownView.value;
    }

    /**
     * Returns a dropdown that allows selecting character groups.
     *
     * @private
     * @param {Iterable.<String>} groupNames The names of the character groups.
     */
    _createGroupDropdown( groupNames ) {
        const locale = this.locale;
        const t = locale.t;
        const dropdown = createDropdown( locale );
        const groupDefinitions = this._getEmotionGroupListItemDefinitions( dropdown, groupNames );

        dropdown.set( 'value', groupDefinitions.first.model.label );

        dropdown.buttonView.bind( 'label' ).to( dropdown, 'value' );

        dropdown.buttonView.set( {
            isOn: false,
            withText: true,
            tooltip: t( '表情组' ),
            class: [ 'ck-dropdown__button_label-width_auto' ]
        } );

        dropdown.on( 'execute', evt => {
            dropdown.value = evt.source.label;
        } );

        dropdown.delegate( 'execute' ).to( this );

        addListToDropdown( dropdown, groupDefinitions );

        return dropdown;
    }

    /**
     * Returns list item definitions to be used in the character group dropdown
     * representing specific character groups.
     *
     * @private
     */
    _getEmotionGroupListItemDefinitions( dropdown, groupNames ) {
        const groupDefs = new Collection();

        for ( const name of groupNames ) {
            const definition = {
                type: 'button',
                model: new Model( {
                    label: name,
                    withText: true
                } )
            };

            definition.model.bind( 'isOn' ).to( dropdown, 'value', value => {
                return value === definition.model.label;
            } );

            groupDefs.add( definition );
        }

        return groupDefs;
    }
}