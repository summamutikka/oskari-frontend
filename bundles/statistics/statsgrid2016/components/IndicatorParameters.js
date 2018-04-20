Oskari.clazz.define('Oskari.statistics.statsgrid.IndicatorParameters', function (instance, sandbox) {
    this.instance = instance;
    this.sb = sandbox;
    this.service = sandbox.getService('Oskari.statistics.statsgrid.StatisticsService');
    this.spinner = Oskari.clazz.create('Oskari.userinterface.component.ProgressSpinner');
    this._values = {};
    this._selections = [];
    Oskari.makeObservable(this);
}, {
    __templates: {
        main: _.template('<div class="stats-ind-params"></div>'),
        select: _.template('<div class="parameter"><div class="label" id=${id}>${label}</div><div class="clear"></div></div>'),
        option: _.template('<option value="${id}">${name}</option>')
    },

    /** **** PUBLIC METHODS ******/

    /**
     * @method  @public  clean clean params
     */
    clean: function () {
        if (!this.container) {
            return;
        }
        this.container.remove();
        this.container = null;
    },

    /**
     * @method  @public indicatorSelected  handle indicator selected
     * @param  {Object} el       jQuery element
     * @param  {Integer} datasrc indicator datasource
     * @param  {String} indId    indicator id
     * @param  {Object} elements elements
     */
    indicatorSelected: function (el, datasrc, indId, elements) {
        var me = this;
        var locale = me.instance.getLocalization();
        var errorService = me.service.getErrorService();
        var panelLoc = locale.panels.newSearch;
        elements = elements || {};

        this.clean();

        if (!indId && indId === '') {
            if (elements.dataLabelWithTooltips) {
                elements.dataLabelWithTooltips.find('.tooltip').show();
            }
            return;
        }

        if ( Array.isArray( indId ) ) {
            me._createCombinedParameters(el, datasrc, indId, elements);
            return;
        }

        var cont = jQuery(this.__templates.main());
        el.append(cont);
        this.container = cont;

        me.spinner.insertTo(cont.parent().parent());
        me.spinner.start();
        if (!this.regionSelector) {
            this.regionSelector = Oskari.clazz.create('Oskari.statistics.statsgrid.RegionsetSelector', me.sb, me.instance.getLocalization());
        }
        this.service.getIndicatorMetadata(datasrc, indId, function (err, indicator) {
            me.spinner.stop();
            if (elements.dataLabelWithTooltips) {
                elements.dataLabelWithTooltips.find('.tooltip').hide();
            }
            if (err) {
                // notify error!!
                errorService.show(locale.errors.title, locale.errors.indicatorMetadataError);
                return;
            }

            // selections
            me._selections = [];
            indicator.selectors.forEach(function (selector, index) {
                var placeholderText = (panelLoc.selectionValues[selector.id] && panelLoc.selectionValues[selector.id].placeholder) ? panelLoc.selectionValues[selector.id].placeholder : panelLoc.defaultPlaceholder;
                var label = (locale.parameters[selector.id]) ? locale.parameters[selector.id] : selector.id;
                var tempSelect = jQuery(me.__templates.select({id: selector.id, label: label}));
                var options = {
                    placeholder_text: placeholderText,
                    allow_single_deselect: true,
                    disable_search_threshold: 10,
                    width: '100%'
                };
                var selections = [];
                var select = Oskari.clazz.create('Oskari.userinterface.component.SelectList', selector.id);

                selector.allowedValues.forEach(function (val) {
                    var name = val.name || val.id || val;
                    val.title = val.name;
                    var optName = (panelLoc.selectionValues[selector.id] && panelLoc.selectionValues[selector.id][name]) ? panelLoc.selectionValues[selector.id][name] : name;

                    var valObject = {
                        id: val.id || val,
                        title: optName
                    };
                    selections.push(valObject);
                });

                var dropdown = select.create(selections, options);
                dropdown.css({width: '205px'});
                select.adjustChosen();
                select.selectFirstValue();
                tempSelect.find('.label').append(dropdown);
                if (index > 0) {
                    dropdown.parent().addClass('margintop');
                }
                cont.append(tempSelect);
                me._selections.push(select);
            });

            if (indicator.regionsets.length === 0) {
                errorService.show(locale.errors.title, locale.errors.regionsetsIsEmpty);
            }
            var regionSelect = me.regionSelector.create(indicator.regionsets);
            me.regionSelector.setWidth(205);
            // try to select the current regionset as default selection
            regionSelect.value(me.service.getStateService().getRegionset());
            cont.append(regionSelect.container);
            // Add margin if there is selections
            if (indicator.selectors.length > 0) {
                regionSelect.container.addClass('margintop');
            } else {
                errorService.show(locale.errors.title, locale.errors.indicatorMetadataIsEmpty);
            }

            me._values = {
                ds: datasrc,
                ind: indId,
                regionsetComponent: regionSelect
            };

            me.trigger('indicator.changed', indicator.regionsets.length > 0);
        });
    },
    _createCombinedParameters: function (el, datasrc, indicators, elements) {
        var me = this;
        var locale = me.instance.getLocalization();
        var panelLoc = locale.panels.newSearch;
        indicators = indicators.filter( function (n) { return n != "" } );

        var cont = jQuery(this.__templates.main());
        el.append(cont);
        this.container = cont;
        var allSelectors = [];
        indicators.forEach( function (indicatorId) {
            me.service.getIndicatorMetadata(datasrc, indicatorId, function (err, indicator) {
                indicator.selectors.forEach( function (selector) {
                    allSelectors.push(selector);
                });
            });
        });

        allSelectors.sort(function (a, b) {
            return a.id > b.id ? 1 : -1;
        });
        var sharedSelectors = allSelectors;
        for ( var i = 0; i < sharedSelectors.length-1; i++ ) {
            if ( sharedSelectors[i].id === sharedSelectors[i+1].id ) {
                sharedSelectors.splice( 1, i )
              }
        }

        var selections = [];
        //put the values from all indicator selectors to the shared selectors
        allSelectors.forEach( function (key) {
            key.allowedValues.forEach(function (val) {
                var name = val.name || val.id || val;
                val.title = val.name;
                var optName = (panelLoc.selectionValues[key.id] && panelLoc.selectionValues[key.id][name]) ? panelLoc.selectionValues[key.id][name] : name;
    
                var valObject = {
                    id: val.id || val,
                    title: optName
                };
                // check if selections contains the value already
                if ( !selections.some(function(key) { return key.id === valObject.id && key.title === valObject.title; }) ) {
                    selections.push(valObject);
                } 
            });
        });
        sharedSelectors.forEach( function ( shared, index ) {
            var placeholderText = (panelLoc.selectionValues[shared.id] && panelLoc.selectionValues[shared.id].placeholder) ? panelLoc.selectionValues[shared.id].placeholder : panelLoc.defaultPlaceholder;
            var label = (locale.parameters[shared.id]) ? locale.parameters[shared.id] : shared.id;
            var tempSelect = jQuery(me.__templates.select({id: shared.id, label: label}));
            var options = {
                placeholder_text: placeholderText,
                allow_single_deselect: true,
                disable_search_threshold: 10,
                width: '100%'
            };
            var select = Oskari.clazz.create('Oskari.userinterface.component.SelectList', shared.id);
            var dropdown = select.create(selections, options);
            dropdown.css({width: '205px'});
            select.adjustChosen();
            select.selectFirstValue();
            tempSelect.find('.label').append(dropdown);
            if (index > 0) {
                dropdown.parent().addClass('margintop');
            }
            cont.append(tempSelect);
        });
        //logic to create only one of each selector and combining the values from all indicators
    },
    getValues: function () {
        var me = this;
        var values = {
            datasource: me._values.ds,
            indicator: me._values.ind,
            regionset: me._values.regionsetComponent.value(),
            selections: {}
        };
        me._selections.forEach(function (select) {
            values.selections[select.getId()] = select.getValue();
        });
        return values;
    }
});
