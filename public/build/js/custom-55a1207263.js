/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * version: 1.3.0
 * https://github.com/wenzhixin/bootstrap-table/
 */

!function ($) {

    'use strict';

    // TOOLS DEFINITION
    // ======================

    // it only does '%s', and return '' when arguments are undefined
    var sprintf = function(str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        if (flag) {
            return str;
        }
        return '';
    };

    var getPropertyFromOther = function (list, from, to, value) {
        var result = '';
        $.each(list, function (i, item) {
            if (item[from] === value) {
                result = item[to];
                return false;
            }
            return true;
        });
        return result;
    };

    var getFieldIndex = function (columns, field) {
        var index = -1;

        $.each(columns, function (i, column) {
            if (column.field === field) {
                index = i;
                return false;
            }
            return true;
        });
        return index;
    };

    var getScrollBarWidth = function () {
        var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
            outer = $('<div/>').addClass('fixed-table-scroll-outer'),
            w1, w2;

        outer.append(inner);
        $('body').append(outer);

        w1 = inner[0].offsetWidth;
        outer.css('overflow', 'scroll');
        w2 = inner[0].offsetWidth;

        if (w1 == w2) {
            w2 = outer[0].clientWidth;
        }

        outer.remove();
        return w1 - w2;
    };

    var calculateObjectValue = function (self, name, args, defaultValue) {
        if (typeof name === 'string') {
            // support obj.func1.func2
            var names = name.split('.');

            if (names.length > 1) {
                name = window;
                $.each(names, function (i, f) {
                    name = name[f];
                });
            } else {
                name = window[name];
            }
        }
        if (typeof name === 'object') {
            return name;
        }
        if (typeof name === 'function') {
            return name.apply(self, args);
        }
        return defaultValue;
    };

    // BOOTSTRAP TABLE CLASS DEFINITION
    // ======================

    var BootstrapTable = function (el, options) {
        this.options = options;
        this.$el = $(el);
        this.$el_ = this.$el.clone();
        this.timeoutId_ = 0;

        this.init();
    };

    BootstrapTable.DEFAULTS = {
        classes: 'table table-hover',
        height: undefined,
        undefinedText: '-',
        sortName: undefined,
        sortOrder: 'asc',
        striped: false,
        columns: [],
        data: [],
        method: 'get',
        url: undefined,
        cache: true,
        contentType: 'application/json',
        queryParams: function (params) {return params;},
        queryParamsType: 'limit', // undefined
        responseHandler: function (res) {return res;},
        pagination: false,
        sidePagination: 'client', // client or server
        totalRows: 0, // server side need to set
        pageNumber: 1,
        pageSize: 10,
        pageList: [10, 25, 50, 100],
        search: false,
        selectItemName: 'btSelectItem',
        showHeader: true,
        showColumns: false,
        showRefresh: false,
        showToggle: false,
        smartDisplay: false,
        minimumCountColumns: 1,
        idField: undefined,
        cardView: false,
        clickToSelect: false,
        singleSelect: false,
        toolbar: undefined,
        checkboxHeader: true,
        sortable: true,
        maintainSelected: false,

        rowStyle: function (row, index) {return {};},

        formatLoadingMessage: function () {
            return 'Loading, please wait…';
        },
        formatRecordsPerPage: function (pageNumber) {
            return sprintf('%s records per page', pageNumber);
        },
        formatShowingRows: function (pageFrom, pageTo, totalRows) {
            return sprintf('Showing %s to %s of %s rows', pageFrom, pageTo, totalRows);
        },
        formatSearch: function () {
            return 'Search';
        },
        formatNoMatches: function () {
            return 'No matching records found';
        },
        formatRefresh: function () {
            return 'Refresh';
        },
        formatToggle: function () {
            return 'Toggle';
        },
        formatColumns: function () {
            return 'Columns';
        },

        onAll: function (name, args) {return false;},
        onClickRow: function (item, $element) {return false;},
        onDblClickRow: function (item, $element) {return false;},
        onSort: function (name, order) {return false;},
        onCheck: function (row) {return false;},
        onUncheck: function (row) {return false;},
        onCheckAll: function () {return false;},
        onUncheckAll: function () {return false;},
        onLoadSuccess: function (data) {return false;},
        onLoadError: function (status) {return false;},
        onColumnSwitch: function (field, checked) {return false;}
    };

    BootstrapTable.COLUMN_DEFAULTS = {
        radio: false,
        checkbox: false,
        checkboxEnabled: true,
        field: undefined,
        title: undefined,
        'class': undefined,
        align: undefined, // left, right, center
        halign: undefined, // left, right, center
        valign: undefined, // top, middle, bottom
        width: undefined,
        sortable: false,
        order: 'asc', // asc, desc
        visible: true,
        switchable: true,
        clickToSelect: true,
        formatter: undefined,
        events: undefined,
        sorter: undefined,
        cellStyle: undefined
    };

    BootstrapTable.EVENTS = {
        'all.bs.table': 'onAll',
        'click-row.bs.table': 'onClickRow',
        'dbl-click-row.bs.table': 'onDblClickRow',
        'sort.bs.table': 'onSort',
        'check.bs.table': 'onCheck',
        'uncheck.bs.table': 'onUncheck',
        'check-all.bs.table': 'onCheckAll',
        'uncheck-all.bs.table': 'onUncheckAll',
        'load-success.bs.table': 'onLoadSuccess',
        'load-error.bs.table': 'onLoadError',
        'column-switch.bs.table': 'onColumnSwitch'
    };

    BootstrapTable.prototype.init = function () {
        this.initContainer();
        this.initTable();
        this.initHeader();
        this.initData();
        this.initToolbar();
        this.initPagination();
        this.initBody();
        this.initServer();
    };

    BootstrapTable.prototype.initContainer = function () {
        this.$container = $([
            '<div class="bootstrap-table">',
                '<div class="fixed-table-toolbar"></div>',
                '<div class="fixed-table-container">',
                    '<div class="fixed-table-header"><table></table></div>',
                    '<div class="fixed-table-body">',
                        '<div class="fixed-table-loading">',
                            this.options.formatLoadingMessage(),
                        '</div>',
                    '</div>',
                    '<div class="fixed-table-pagination"></div>',
                '</div>',
            '</div>'].join(''));

        this.$container.insertAfter(this.$el);
        this.$container.find('.fixed-table-body').append(this.$el);
        this.$container.after('<div class="clearfix"></div>');
        this.$loading = this.$container.find('.fixed-table-loading');

        this.$el.addClass(this.options.classes);
        if (this.options.striped) {
            this.$el.addClass('table-striped');
        }
    };

    BootstrapTable.prototype.initTable = function () {
        var that = this,
            columns = [],
            data = [];

        this.$header = this.$el.find('thead');
        if (!this.$header.length) {
            this.$header = $('<thead></thead>').appendTo(this.$el);
        }
        if (!this.$header.find('tr').length) {
            this.$header.append('<tr></tr>');
        }
        this.$header.find('th').each(function () {
            var column = $.extend({}, {
                title: $(this).html(),
                'class': $(this).attr('class')
            }, $(this).data());

            columns.push(column);
        });
        this.options.columns = $.extend([], columns, this.options.columns);
        $.each(this.options.columns, function (i, column) {
            that.options.columns[i] = $.extend({}, BootstrapTable.COLUMN_DEFAULTS,
                {field: i}, column); // when field is undefined, use index instead
        });

        // if options.data is setting, do not process tbody data
        if (this.options.data.length) {
            return;
        }

        this.$el.find('tbody tr').each(function () {
            var row = {};

            // save tr's id and class
            row._id = $(this).attr('id');
            row._class = $(this).attr('class');

            $(this).find('td').each(function (i) {
                var field = that.options.columns[i].field;

                row[field] = $(this).html();
                // save td's id and class
                row['_' + field + '_id'] = $(this).attr('id');
                row['_' + field + '_class'] = $(this).attr('class');
            });
            data.push(row);
        });
        this.options.data = data;
    };

    BootstrapTable.prototype.initHeader = function () {
        var that = this,
            visibleColumns = [],
            html = [];

        this.header = {
            fields: [],
            styles: [],
            classes: [],
            formatters: [],
            events: [],
            sorters: [],
            cellStyles: [],
            clickToSelects: []
        };
        $.each(this.options.columns, function (i, column) {
            var text = '',
                style = '',
                class_ = sprintf(' class="%s"', column['class']),
                order = that.options.sortOrder || column.order;

            if (!column.visible) {
                return;
            }

            style = sprintf('text-align: %s; ', column.halign ? column.halign : column.align);
            style += sprintf('vertical-align: %s; ', column.valign);
            style += sprintf('width: %spx; ', column.checkbox || column.radio ? 36 : column.width);

            visibleColumns.push(column);
            that.header.fields.push(column.field);
            that.header.styles.push(style);
            that.header.classes.push(class_);
            that.header.formatters.push(column.formatter);
            that.header.events.push(column.events);
            that.header.sorters.push(column.sorter);
            that.header.cellStyles.push(column.cellStyle);
            that.header.clickToSelects.push(column.clickToSelect);

            html.push('<th',
                column.checkbox || column.radio ?
                    sprintf(' class="bs-checkbox %s"', column['class'] || '') :
                    class_,
                sprintf(' style="%s"', style),
                '>');
            html.push(sprintf('<div class="th-inner %s">', that.options.sortable && column.sortable ?
                'sortable' : ''));

            text = column.title;
            if (that.options.sortName === column.field && that.options.sortable && column.sortable) {
                text += that.getCaretHtml();
            }

            if (column.checkbox) {
                if (!that.options.singleSelect && that.options.checkboxHeader) {
                    text = '<input name="btSelectAll" type="checkbox" />';
                }
                that.header.stateField = column.field;
            }
            if (column.radio) {
                text = '';
                that.header.stateField = column.field;
                that.options.singleSelect = true;
            }

            html.push(text);
            html.push('</div>');
            html.push('<div class="fht-cell"></div>');
            html.push('</th>');
        });

        this.$header.find('tr').html(html.join(''));
        this.$header.find('th').each(function (i) {
            $(this).data(visibleColumns[i]);
        });
        this.$container.off('click', 'th').on('click', 'th', function (event) {
            if (that.options.sortable && $(this).data().sortable) {
                that.onSort(event);
            }
        });

        if (!this.options.showHeader || this.options.cardView) {
            this.$header.hide();
            this.$container.find('.fixed-table-header').hide();
            this.$loading.css('top', 0);
        } else {
            this.$header.show();
            this.$container.find('.fixed-table-header').show();
            this.$loading.css('top', '37px');
        }

        this.$selectAll = this.$header.find('[name="btSelectAll"]');
        this.$container.off('click', '[name="btSelectAll"]')
            .on('click', '[name="btSelectAll"]', function () {
                var checked = $(this).prop('checked');
                that[checked ? 'checkAll' : 'uncheckAll']();
            });
    };

    BootstrapTable.prototype.initData = function (data, append) {
        if (append) {
            this.data = this.data.concat(data);
        } else {
            this.data = data || this.options.data;
        }
        this.options.data = this.data;

        if (this.options.sidePagination === 'server') {
            return;
        }
        this.initSort();
    };

    BootstrapTable.prototype.initSort = function () {
        var that = this,
            name = this.options.sortName,
            order = this.options.sortOrder === 'desc' ? -1 : 1,
            index = $.inArray(this.options.sortName, this.header.fields);

        if (index !== -1) {
            this.data.sort(function (a, b) {
                var aa = a[name],
                    bb = b[name],
                    value = calculateObjectValue(that.header, that.header.sorters[index], [aa, bb]);

                if (value !== undefined) {
                    return order * value;
                }

                // Fix #161: undefined or null string sort bug.
                if (aa === null) {
                    aa = '';
                }
                if (bb === null) {
                    bb = '';
                }

                if (aa === bb) {
                    return 0;
                }
                if (aa < bb) {
                    return order * -1;
                }
                return order;
            });
        }
    };

    BootstrapTable.prototype.onSort = function (event) {
        var $this = $(event.currentTarget),
            $this_ = this.$header.find('th').eq($this.index());

        this.$header.add(this.$header_).find('span.order').remove();

        if (this.options.sortName === $this.data('field')) {
            this.options.sortOrder = this.options.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.options.sortName = $this.data('field');
            this.options.sortOrder = $this.data('order') === 'asc' ? 'desc' : 'asc';
        }
        this.trigger('sort', this.options.sortName, this.options.sortOrder);

        $this.add($this_).data('order', this.options.sortOrder)
            .find('.th-inner').append(this.getCaretHtml());

        if (this.options.sidePagination === 'server') {
            this.initServer();
            return;
        }
        this.initSort();
        this.initBody();
    };

    BootstrapTable.prototype.initToolbar = function () {
        var that = this,
            html = [],
            timeoutId = 0,
            $keepOpen,
            $search,
            switchableCount = 0;

        this.$toolbar = this.$container.find('.fixed-table-toolbar').html('');

        if (typeof this.options.toolbar === 'string') {
            $('<div class="bars pull-left"></div>')
                .appendTo(this.$toolbar)
                .append($(this.options.toolbar));
        }

        // showColumns, showToggle, showRefresh
        html = ['<div class="columns btn-group pull-right">'];

        if (this.options.showRefresh) {
            html.push(sprintf('<button class="btn btn-default" type="button" name="refresh" title="%s">',
                this.options.formatRefresh()),
                '<i class="glyphicon glyphicon-refresh icon-refresh"></i>',
                '</button>');
        }

        if (this.options.showToggle) {
            html.push(sprintf('<button class="btn btn-default" type="button" name="toggle" title="%s">',
                this.options.formatToggle()),
                '<i class="glyphicon glyphicon glyphicon-list-alt icon-list-alt"></i>',
                '</button>');
        }

        if (this.options.showColumns) {
            html.push(sprintf('<div class="keep-open %s" title="%s">',
                this.options.showRefresh || this.options.showToggle ? 'btn-group' : '',
                this.options.formatColumns()),
                '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">',
                '<i class="glyphicon glyphicon-th icon-th"></i>',
                ' <span class="caret"></span>',
                '</button>',
                '<ul class="dropdown-menu" role="menu">');

            $.each(this.options.columns, function (i, column) {
                if (column.radio || column.checkbox) {
                    return;
                }
                var checked = column.visible ? ' checked="checked"' : '';

                if (column.switchable) {
                    html.push(sprintf('<li>' +
                        '<label><input type="checkbox" data-field="%s" value="%s"%s> %s</label>' +
                        '</li>', column.field, i, checked, column.title));
                    switchableCount++;
                }
            });
            html.push('</ul>',
                '</div>');
        }

        html.push('</div>');

        if (html.length > 2) {
            this.$toolbar.append(html.join(''));
        }

        if (this.options.showRefresh) {
            this.$toolbar.find('button[name="refresh"]')
                .off('click').on('click', $.proxy(this.refresh, this));
        }

        if (this.options.showToggle) {
            this.$toolbar.find('button[name="toggle"]')
                .off('click').on('click', function () {
                    that.options.cardView = !that.options.cardView;
                    that.initHeader();
                    that.initBody();
                });
        }

        if (this.options.showColumns) {
            $keepOpen = this.$toolbar.find('.keep-open');

            if (switchableCount <= this.options.minimumCountColumns) {
                $keepOpen.find('input').prop('disabled', true);
            }

            $keepOpen.find('li').off('click').on('click', function (event) {
                event.stopImmediatePropagation();
            });
            $keepOpen.find('input').off('click').on('click', function () {
                var $this = $(this);

                that.toggleColumn($this.val(), $this.prop('checked'), false);
                that.trigger('column-switch', $(this).data('field'), $this.prop('checked'));
            });
        }

        if (this.options.search) {
            html = [];
            html.push(
                '<div class="pull-right search">',
                    sprintf('<input class="form-control" type="text" placeholder="%s">',
                        this.options.formatSearch()),
                '</div>');

            this.$toolbar.append(html.join(''));
            $search = this.$toolbar.find('.search input');
            $search.off('keyup').on('keyup', function (event) {
                clearTimeout(timeoutId); // doesn't matter if it's 0
                timeoutId = setTimeout(function () {
                    that.onSearch(event);
                }, 500); // 500ms
            });
        }
    };

    BootstrapTable.prototype.onSearch = function (event) {
        var text = $.trim($(event.currentTarget).val());

        // trim search input
        $(event.currentTarget).val(text);

        if (text === this.searchText) {
            return;
        }
        this.searchText = text;

        this.options.pageNumber = 1;
        this.initSearch();
        this.updatePagination();
    };

    BootstrapTable.prototype.initSearch = function () {
        var that = this;

        if (this.options.sidePagination !== 'server') {
            var s = this.searchText && this.searchText.toLowerCase();

            this.data = s ? $.grep(this.options.data, function (item, i) {
                for (var key in item) {
                    key = $.isNumeric(key) ? parseInt(key, 10) : key;
                    var value = item[key];

                    // Fix #142: search use formated data
                    value = calculateObjectValue(that.header,
                        that.header.formatters[$.inArray(key, that.header.fields)],
                        [value, item, i], value);

                    if ($.inArray(key, that.header.fields) !== -1 &&
                        (typeof value === 'string' ||
                        typeof value === 'number') &&
                        (value + '').toLowerCase().indexOf(s) !== -1) {
                        return true;
                    }
                }
                return false;
            }) : this.options.data;
        }
    };

    BootstrapTable.prototype.initPagination = function () {
        this.$pagination = this.$container.find('.fixed-table-pagination');

        if (!this.options.pagination) {
            return;
        }
        var that = this,
            html = [],
            i, from, to,
            $pageList,
            $first, $pre,
            $next, $last,
            $number,
            data = this.searchText ? this.data : this.options.data;

        if (this.options.sidePagination !== 'server') {
            this.options.totalRows = data.length;
        }

        this.totalPages = 0;
        if (this.options.totalRows) {
            this.totalPages = ~~((this.options.totalRows - 1) / this.options.pageSize) + 1;
        }
        if (this.totalPages > 0 && this.options.pageNumber > this.totalPages) {
            this.options.pageNumber = this.totalPages;
        }

        this.pageFrom = (this.options.pageNumber - 1) * this.options.pageSize + 1;
        this.pageTo = this.options.pageNumber * this.options.pageSize;
        if (this.pageTo > this.options.totalRows) {
            this.pageTo = this.options.totalRows;
        }

        html.push(
            '<div class="pull-left pagination-detail">',
                '<span class="pagination-info">',
                    this.options.formatShowingRows(this.pageFrom, this.pageTo, this.options.totalRows),
                '</span>');

        html.push('<span class="page-list">');

        var pageNumber = [
            '<span class="btn-group dropup">',
            '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">',
            '<span class="page-size">',
            this.options.pageSize,
            '</span>',
            ' <span class="caret"></span>',
            '</button>',
            '<ul class="dropdown-menu" role="menu">'],
            pageList = this.options.pageList;

        if (typeof this.options.pageList === 'string') {
            var list = this.options.pageList.slice(1, -1).replace(/ /g, '').split(',');

            pageList = [];
            $.each(list, function (i, value) {
                pageList.push(+value);
            });
        }

        $.each(pageList, function (i, page) {
            if (that.options.smartDisplay === false || that.options.totalRows >= page || page == pageList[0]) {
                var active = page === that.options.pageSize ? ' class="active"' : '';
                pageNumber.push(sprintf('<li%s><a href="javascript:void(0)">%s</a></li>', active, page));
            }
        });
        pageNumber.push('</ul></span>');

        html.push(this.options.formatRecordsPerPage(pageNumber.join('')));
        html.push('</span>');

        html.push('</div>',
            '<div class="pull-right pagination">',
                '<ul class="pagination">',
                    '<li class="page-first"><a href="javascript:void(0)">&lt;&lt;</a></li>',
                    '<li class="page-pre"><a href="javascript:void(0)">&lt;</a></li>');

        if (this.totalPages < 5) {
            from = 1;
            to = this.totalPages;
        } else {
            from = this.options.pageNumber - 2;
            to = from + 4;
            if (from < 1) {
                from = 1;
                to = 5;
            }
            if (to > this.totalPages) {
                to = this.totalPages;
                from = to - 4;
            }
        }
        for (i = from; i <= to; i++) {
            html.push('<li class="page-number' + (i === this.options.pageNumber ? ' active disabled' : '') + '">',
                '<a href="javascript:void(0)">', i ,'</a>',
                '</li>');
        }

        html.push(
                    '<li class="page-next"><a href="javascript:void(0)">&gt;</a></li>',
                    '<li class="page-last"><a href="javascript:void(0)">&gt;&gt;</a></li>',
                '</ul>',
            '</div>');

        this.$pagination.html(html.join(''));

        $pageList = this.$pagination.find('.page-list a');
        $first = this.$pagination.find('.page-first');
        $pre = this.$pagination.find('.page-pre');
        $next = this.$pagination.find('.page-next');
        $last = this.$pagination.find('.page-last');
        $number = this.$pagination.find('.page-number');

        if (this.options.pageNumber <= 1) {
            $first.addClass('disabled');
            $pre.addClass('disabled');
        }
        if (this.options.pageNumber >= this.totalPages) {
            $next.addClass('disabled');
            $last.addClass('disabled');
        }
        if (this.options.smartDisplay) {
            if (this.totalPages <= 1) {
                this.$pagination.find('div.pagination').hide();
            }
            if (this.options.totalRows <= this.options.pageList[1]) {
                this.$pagination.find('div.pagination-detail').hide();
            }
        }
        $pageList.off('click').on('click', $.proxy(this.onPageListChange, this));
        $first.off('click').on('click', $.proxy(this.onPageFirst, this));
        $pre.off('click').on('click', $.proxy(this.onPagePre, this));
        $next.off('click').on('click', $.proxy(this.onPageNext, this));
        $last.off('click').on('click', $.proxy(this.onPageLast, this));
        $number.off('click').on('click', $.proxy(this.onPageNumber, this));
    };

    BootstrapTable.prototype.updatePagination = function (event) {
        // Fix #171: IE disabled button can be clicked bug.
        if (event && $(event.currentTarget).hasClass('disabled')) {
            return;
        }

        if (!this.options.maintainSelected) {
            this.resetRows();
        }

        this.initPagination();
        if (this.options.sidePagination === 'server') {
            this.initServer();
        } else {
            this.initBody();
        }
    };

    BootstrapTable.prototype.onPageListChange = function (event) {
        var $this = $(event.currentTarget);

        $this.parent().addClass('active').siblings().removeClass('active');
        this.options.pageSize = +$this.text();
        this.$toolbar.find('.page-size').text(this.options.pageSize);
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageFirst = function (event) {
        this.options.pageNumber = 1;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPagePre = function (event) {
        this.options.pageNumber--;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageNext = function (event) {
        this.options.pageNumber++;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageLast = function (event) {
        this.options.pageNumber = this.totalPages;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageNumber = function (event) {
        if (this.options.pageNumber === +$(event.currentTarget).text()) {
            return;
        }
        this.options.pageNumber = +$(event.currentTarget).text();
        this.updatePagination(event);
    };

    BootstrapTable.prototype.initBody = function (fixedScroll) {
        var that = this,
            html = [],
            data = this.getData();

        this.$body = this.$el.find('tbody');
        if (!this.$body.length) {
            this.$body = $('<tbody></tbody>').appendTo(this.$el);
        }

        if (this.options.sidePagination === 'server') {
            data = this.data;
        }

        if (!this.options.pagination || this.options.sidePagination === 'server') {
            this.pageFrom = 1;
            this.pageTo = data.length;
        }

        for (var i = this.pageFrom - 1; i < this.pageTo; i++) {
            var item = data[i],
                style = {},
                csses = [];

            style = calculateObjectValue(this.options, this.options.rowStyle, [item, i], style);

            if (style && style.css) {
                for (var key in style.css) {
                    csses.push(key + ': ' + style.css[key]);
                }
            }

            html.push('<tr',
                sprintf(' id="%s"', item._id),
                sprintf(' class="%s"', style.classes || item._class),
                sprintf(' data-index="%s"', i),
                '>'
            );

            if (this.options.cardView) {
                html.push(sprintf('<td colspan="%s">', this.header.fields.length));
            }

            $.each(this.header.fields, function (j, field) {
                var text = '',
                    value = item[field],
                    type = '',
                    cellStyle = {},
                    id_ = '',
                    class_ = that.header.classes[j];
                    style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

                value = calculateObjectValue(that.header,
                    that.header.formatters[j], [value, item, i], value);

                // handle td's id and class
                if (item['_' + field + '_id']) {
                    id_ = sprintf(' id="%s"', item['_' + field + '_id']);
                }
                if (item['_' + field + '_class']) {
                    class_ = sprintf(' class="%s"', item['_' + field + '_class']);
                }

                cellStyle = calculateObjectValue(that.header,
                    that.header.cellStyles[j], [value, item, i], cellStyle);
                if (cellStyle.classes) {
                    class_ = sprintf(' class="%s"', cellStyle.classes);
                }
                if (cellStyle.css) {
                    csses = [];
                    for (var key in cellStyle.css) {
                        csses.push(key + ': ' + cellStyle.css[key]);
                    }
                    style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));
                }

                if (that.options.columns[j].checkbox || that.options.columns[j].radio) {
                    //if card view mode bypass
                    if (that.options.cardView) {
                        return true;
                    }

                    type = that.options.columns[j].checkbox ? 'checkbox' : type;
                    type = that.options.columns[j].radio ? 'radio' : type;

                    text = ['<td class="bs-checkbox">',
                        '<input' +
                            sprintf(' data-index="%s"', i) +
                            sprintf(' name="%s"', that.options.selectItemName) +
                            sprintf(' type="%s"', type) +
                            sprintf(' value="%s"', item[that.options.idField]) +
                            sprintf(' checked="%s"', value === true ||
                                (value && value.checked) ? 'checked' : undefined) +
                            sprintf(' disabled="%s"', !that.options.columns[j].checkboxEnabled ||
                                (value && value.disabled) ? 'disabled' : undefined) +
                            ' />',
                        '</td>'].join('');
                } else {
                    value = typeof value === 'undefined' ? that.options.undefinedText : value;

                    text = that.options.cardView ?
                        ['<div class="card-view">',
                            that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                                getPropertyFromOther(that.options.columns, 'field', 'title', field)) : '',
                            sprintf('<span class="value">%s</span>', value),
                            '</div>'].join('') :
                        [sprintf('<td%s %s %s>', id_, class_, style),
                            value,
                            '</td>'].join('');
                }

                html.push(text);
            });

            if (this.options.cardView) {
                html.push('</td>');
            }

            html.push('</tr>');
        }

        // show no records
        if (!html.length) {
            html.push('<tr class="no-records-found">',
                sprintf('<td colspan="%s">%s</td>', this.header.fields.length, this.options.formatNoMatches()),
                '</tr>');
        }

        this.$body.html(html.join(''));

        if (!fixedScroll) {
            this.$container.find('.fixed-table-body').scrollTop(0);
        }

        // click to select by column
        this.$body.find('> tr > td').off('click').on('click', function () {
            var $tr = $(this).parent();
            that.trigger('click-row', that.data[$tr.data('index')], $tr);
            // if click to select - then trigger the checkbox/radio click
            if (that.options.clickToSelect) {
                if (that.header.clickToSelects[$tr.children().index($(this))]) {
                    $tr.find(sprintf('[name="%s"]',
                        that.options.selectItemName)).trigger('click');
                }
            }
        });
        this.$body.find('tr').off('dblclick').on('dblclick', function () {
            that.trigger('dbl-click-row', that.data[$(this).data('index')], $(this));
        });

        this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
        this.$selectItem.off('click').on('click', function (event) {
            event.stopImmediatePropagation();

            // radio trigger click event bug!
            if ($(this).is(':radio')) {
                $(this).prop('checked', true);
            }

            var checkAll = that.$selectItem.filter(':enabled').length ===
                    that.$selectItem.filter(':enabled').filter(':checked').length,
                checked = $(this).prop('checked'),
                row = that.data[$(this).data('index')];

            that.$selectAll.add(that.$selectAll_).prop('checked', checkAll);
            row[that.header.stateField] = checked;
            that.trigger(checked ? 'check' : 'uncheck', row);

            if (that.options.singleSelect) {
                that.$selectItem.not(this).each(function () {
                    that.data[$(this).data('index')][that.header.stateField] = false;
                });
                that.$selectItem.filter(':checked').not(this).prop('checked', false);
            }

            that.updateSelected();
        });

        $.each(this.header.events, function (i, events) {
            if (!events) {
                return;
            }
            // fix bug, if events is defined with namespace
            if (typeof events === 'string') {
                events = calculateObjectValue(null, events);
            }
            for (var key in events) {
                that.$body.find('tr').each(function () {
                    var $tr = $(this),
                        $td = $tr.find('td').eq(i),
                        index = key.indexOf(' '),
                        name = key.substring(0, index),
                        el = key.substring(index + 1),
                        func = events[key];

                    $td.find(el).off(name).on(name, function (e) {
                        var index = $tr.data('index'),
                            row = that.data[index],
                            value = row[that.header.fields[i]];

                        func(e, value, row, index);
                    });
                });
            }
        });

        this.updateSelected();
        this.resetView();
    };

    BootstrapTable.prototype.initServer = function (silent) {
        var that = this,
            data = {},
            params = {
                pageSize: this.options.pageSize,
                pageNumber: this.options.pageNumber,
                searchText: this.searchText,
                sortName: this.options.sortName,
                sortOrder: this.options.sortOrder
            };

        if (!this.options.url) {
            return;
        }

        if (this.options.queryParamsType === 'limit') {
            params = {
                limit: params.pageSize,
                offset: params.pageSize * (params.pageNumber - 1),
                search: params.searchText,
                sort: params.sortName,
                order: params.sortOrder
            };
        }
        data = calculateObjectValue(this.options, this.options.queryParams, [params], data);

        // false to stop request
        if (data === false) {
            return;
        }

        if (!silent) {
            this.$loading.show();
        }

        $.ajax({
            type: this.options.method,
            url: this.options.url,
            data: data,
            cache: this.options.cache,
            contentType: this.options.contentType,
            dataType: 'json',
            success: function (res) {
                res = calculateObjectValue(that.options, that.options.responseHandler, [res], res);

                var data = res;

                if (that.options.sidePagination === 'server') {
                    that.options.totalRows = res.total;
                    data = res.rows;
                }
                that.load(data);
                that.trigger('load-success', data);
            },
            error: function (res) {
                that.trigger('load-error', res.status);
            },
            complete: function () {
                if (!silent) {
                    that.$loading.hide();
                }
            }
        });
    };

    BootstrapTable.prototype.getCaretHtml = function () {
        return ['<span class="order' + (this.options.sortOrder === 'desc' ? '' : ' dropup') + '">',
                '<span class="caret" style="margin: 10px 5px;"></span>',
            '</span>'].join('');
    };

    BootstrapTable.prototype.updateSelected = function () {
        this.$selectItem.each(function () {
            $(this).parents('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected');
        });
    };

    BootstrapTable.prototype.updateRows = function (checked) {
        var that = this;

        this.$selectItem.each(function () {
            that.data[$(this).data('index')][that.header.stateField] = checked;
        });
    };

    BootstrapTable.prototype.resetRows = function () {
        var that = this;

        $.each(this.data, function (i, row) {
            that.$selectAll.prop('checked', false);
            that.$selectItem.prop('checked', false);
            row[that.header.stateField] = false;
        });
    };

    BootstrapTable.prototype.trigger = function (name) {
        var args = Array.prototype.slice.call(arguments, 1);

        name += '.bs.table';
        this.options[BootstrapTable.EVENTS[name]].apply(this.options, args);
        this.$el.trigger($.Event(name), args);

        this.options.onAll(name, args);
        this.$el.trigger($.Event('all.bs.table'), [name, args]);
    };

    BootstrapTable.prototype.resetHeader = function () {
        var that = this,
            $fixedHeader = this.$container.find('.fixed-table-header'),
            $fixedBody = this.$container.find('.fixed-table-body'),
            scrollWidth = this.$el.width() > $fixedBody.width() ? getScrollBarWidth() : 0;

        // fix #61: the hidden table reset header bug.
        if (this.$el.is(':hidden')) {
            clearTimeout(this.timeoutId_); // doesn't matter if it's 0
            this.timeoutId_ = setTimeout($.proxy(this.resetHeader, this), 100); // 100ms
            return;
        }

        this.$header_ = this.$header.clone(true, true);
        this.$selectAll_ = this.$header_.find('[name="btSelectAll"]');

        // fix bug: get $el.css('width') error sometime (height = 500)
        setTimeout(function () {
            $fixedHeader.css({
                'height': '37px',
                'border-bottom': '1px solid #dddddd',
                'margin-right': scrollWidth
            }).find('table').css('width', that.$el.css('width'))
                .html('').attr('class', that.$el.attr('class'))
                .append(that.$header_);

            // fix bug: $.data() is not working as expected after $.append()
            that.$header.find('th').each(function (i) {
                that.$header_.find('th').eq(i).data($(this).data());
            });

            that.$body.find('tr:first-child:not(.no-records-found) > *').each(function(i) {
                that.$header_.find('div.fht-cell').eq(i).width($(this).innerWidth());
            });

            that.$el.css('margin-top', -that.$header.height());

            // horizontal scroll event
            $fixedBody.off('scroll').on('scroll', function () {
                $fixedHeader.scrollLeft($(this).scrollLeft());
            });
        });
    };

    BootstrapTable.prototype.toggleColumn = function (index, checked, needUpdate) {
        if (index === -1) {
            return;
        }
        this.options.columns[index].visible = checked;
        this.initHeader();
        this.initSearch();
        this.initPagination();
        this.initBody();

        if (this.options.showColumns) {
            var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

            if (needUpdate) {
                $items.filter(sprintf('[value="%s"]', index)).prop('checked', checked);
            }

            if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                $items.filter(':checked').prop('disabled', true);
            }
        }
    };

    // PUBLIC FUNCTION DEFINITION
    // =======================

    BootstrapTable.prototype.resetView = function (params) {
        var that = this,
            header = this.header;

        if (params && params.height) {
            this.options.height = params.height;
        }

        this.$selectAll.prop('checked', this.$selectItem.length > 0 &&
            this.$selectItem.length === this.$selectItem.filter(':checked').length);

        if (this.options.height) {
            var toolbarHeight = +this.$toolbar.children().outerHeight(true),
                paginationHeight = +this.$pagination.children().outerHeight(true),
                height = this.options.height - toolbarHeight - paginationHeight;

            this.$container.find('.fixed-table-container').css('height', height + 'px');
        }

        if (this.options.cardView) {
            // remove the element css
            that.$el.css('margin-top', '0');
            that.$container.find('.fixed-table-container').css('padding-bottom', '0');
            return;
        }

        if (this.options.showHeader && this.options.height) {
            this.resetHeader();
        }

        if (this.options.height && this.options.showHeader) {
            this.$container.find('.fixed-table-container').css('padding-bottom', '37px');
        }
    };

    BootstrapTable.prototype.getData = function () {
        return this.searchText ? this.data : this.options.data;
    };

    BootstrapTable.prototype.load = function (data) {
        this.initData(data);
        this.initSearch();
        this.initPagination();
        this.initBody();
    };

    BootstrapTable.prototype.append = function (data) {
        this.initData(data, true);
        this.initSearch();
        this.initPagination();
        this.initBody(true);
    };

    BootstrapTable.prototype.remove = function (params) {
        var len = this.options.data.length,
            i, row;

        if (!params.hasOwnProperty('field') || !params.hasOwnProperty('values')) {
            return;
        }

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (!row.hasOwnProperty(params.field)) {
                return;
            }
            if ($.inArray(row[params.field], params.values) !== -1) {
                this.options.data.splice(i, 1);
            }
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initBody(true);
    };

    BootstrapTable.prototype.updateRow = function (params) {
        if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
            return;
        }
        $.extend(this.data[params.index], params.row);
        this.initBody();
    };

    BootstrapTable.prototype.mergeCells = function (options) {
        var row = options.index,
            col = $.inArray(options.field, this.header.fields),
            rowspan = options.rowspan || 1,
            colspan = options.colspan || 1,
            i, j,
            $tr = this.$body.find('tr'),
            $td = $tr.eq(row).find('td').eq(col);

        if (row < 0 || col < 0 || row >= this.data.length) {
            return;
        }

        for (i = row; i < row + rowspan; i++) {
            for (j = col; j < col + colspan; j++) {
                $tr.eq(i).find('td').eq(j).hide();
            }
        }

        $td.attr('rowspan', rowspan).attr('colspan', colspan)
            .show(10, $.proxy(this.resetView, this));
    };

    BootstrapTable.prototype.getSelections = function () {
        var that = this;

        return $.grep(this.data, function (row) {
            return row[that.header.stateField];
        });
    };

    BootstrapTable.prototype.checkAll = function () {
        this.$selectAll.add(this.$selectAll_).prop('checked', true);
        this.$selectItem.filter(':enabled').prop('checked', true);
        this.updateRows(true);
        this.updateSelected();
        this.trigger('check-all');
    };

    BootstrapTable.prototype.uncheckAll = function () {
        this.$selectAll.add(this.$selectAll_).prop('checked', false);
        this.$selectItem.filter(':enabled').prop('checked', false);
        this.updateRows(false);
        this.updateSelected();
        this.trigger('uncheck-all');
    };

    BootstrapTable.prototype.destroy = function () {
        this.$el.insertBefore(this.$container);
        $(this.options.toolbar).insertBefore(this.$el);
        this.$container.next().remove();
        this.$container.remove();
        this.$el.html(this.$el_.html())
            .attr('class', this.$el_.attr('class') || ''); // reset the class
    };

    BootstrapTable.prototype.showLoading = function () {
        this.$loading.show();
    };

    BootstrapTable.prototype.hideLoading = function () {
        this.$loading.hide();
    };

    BootstrapTable.prototype.refresh = function (params) {
        if (params && params.url) {
            this.options.url = params.url;
            this.options.pageNumber = 1;
        }
        this.initServer(params && params.silent);
    };

    BootstrapTable.prototype.showColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.options.columns, field), true, true);
    };

    BootstrapTable.prototype.hideColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.options.columns, field), false, true);
    };


    // BOOTSTRAP TABLE PLUGIN DEFINITION
    // =======================

    var allowedMethods = [
        'getSelections', 'getData',
        'load', 'append', 'remove',
        'updateRow',
        'mergeCells',
        'checkAll', 'uncheckAll',
        'refresh',
        'resetView',
        'destroy',
        'showLoading', 'hideLoading',
        'showColumn', 'hideColumn'
    ];

    $.fn.bootstrapTable = function (option, _relatedTarget) {
        var value;

        this.each(function () {
            var $this = $(this),
                data = $this.data('bootstrap.table'),
                options = $.extend({}, BootstrapTable.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw "Unknown method: " + option;
                }

                if (!data) {
                    return;
                }

                value = data[option](_relatedTarget);

                if (option === 'destroy') {
                    $this.removeData('bootstrap.table');
                }
            }

            if (!data) {
                $this.data('bootstrap.table', (data = new BootstrapTable(this, options)));
            }
        });

        return typeof value === 'undefined' ? this : value;
    };

    $.fn.bootstrapTable.Constructor = BootstrapTable;
    $.fn.bootstrapTable.defaults = BootstrapTable.DEFAULTS;
    $.fn.bootstrapTable.columnDefaults = BootstrapTable.COLUMN_DEFAULTS;
    $.fn.bootstrapTable.methods = allowedMethods;

    // BOOTSTRAP TABLE INIT
    // =======================

    $(function () {
        $('[data-toggle="table"]').bootstrapTable();
    });

}(jQuery);


!function ($) {
	$(document).on("click","ul.nav li.parent > a > span.icon", function(){		  
		$(this).find('em:first').toggleClass("glyphicon-minus");	  
	}); 
	$(".sidebar span.icon").find('em:first').addClass("glyphicon-plus");
}(window.jQuery);

$(window).on('resize', function () {
  if ($(window).width() > 768) $('#sidebar-collapse').collapse('show')
})
$(window).on('resize', function () {
  if ($(window).width() <= 767) $('#sidebar-collapse').collapse('hide')
})

var icons = '<svg id="glyphs-sheet" xmlns=\"http://www.w3.org/2000/svg\" style=\"display:none;\"><defs><symbol id=\"stroked-bacon-burger\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41\x2018H3c\x2D.6\x200\x2D1\x2D.4\x2D1\x2D1v\x2D2C2\x208.9\x206.9\x204\x2013\x204h18c6\x200\x2011\x204.9\x2011\x2011v2c0\x20.6\x2D.4\x201\x2D1\x201zM39\x2037H5c\x2D1.7\x200\x2D3\x2D1.3\x2D3\x2D3v\x2D2c0\x2D.6.4\x2D1\x201\x2D1h38c.5\x200\x201\x20.5\x201\x201v2c0\x201.7\x2D1.3\x203\x2D3\x203zM1\x2027h42M1\x2022c3.5\x200\x203.5\x202\x207\x202s3.5\x2D2\x207\x2D2\x203.5\x202\x207\x202\x203.5\x2D2\x207\x2D2\x203.5\x202\x207\x202\x203.5\x2D2\x207\x2D2\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinecap\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-paper-coffee-cup\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M31.6\x2043H12.4L9\x209h26z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M35\x206H9V2c0\x2D.6.4\x2D1\x201\x2D1h24c.6\x200\x201\x20.4\x201\x201v4z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M7\x206h30v3H7zM9.8\x2017h24.4M11.6\x2035h20.8\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-round-coffee-mug\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M33\x2011v16c0\x208.8\x2D7.2\x2016\x2D16\x2016S1\x2035.8\x201\x2027V11h32zM37\x2027h\x2D4V15h4c3.3\x200\x206\x202.7\x206\x206s\x2D2.7\x206\x2D6\x206z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-wireless-router\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M33\x2027v3h\x2D3M39\x2027v3h\x2D3\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41\x2034H3c\x2D1.1\x200\x2D2\x2D.9\x2D2\x2D2v\x2D6c0\x2D1.1.9\x2D2\x202\x2D2h38c1.1\x200\x202\x20.9\x202\x202v6c0\x201.1\x2D.9\x202\x2D2\x202z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M5\x2034h6v3H5zM33\x2034h6v3h\x2D6z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M14\x2024L7\x2013.3M30\x2024l7\x2D10.7\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M25.4\x2015c\x2D.7\x2D1.2\x2D2\x2D2\x2D3.4\x2D2s\x2D2.7.8\x2D3.4\x201.9M29.4\x2010.3C27.6\x208.3\x2024.9\x207\x2022\x207c\x2D2.9\x200\x2D5.5\x201.3\x2D7.4\x203.3\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-pen-tip\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M26.7\x206L38\x2017.3l\x2D6.3\x2013.4L2\x2042l11.3\x2D29.7zM2\x2042l19.1\x2D19.1\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2223.2\x22\x20cy\x3D\x2220.8\x22\x20r\x3D\x223\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M30.5\x201.3l12.2\x2012.2c.5.5.4\x201.3\x2D.3\x201.6L38\x2017.3\x2026.7\x206l2.2\x2D4.4c.3\x2D.7\x201.1\x2D.8\x201.6\x2D.3z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-usb-flash-drive\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M30\x2043H14c\x2D1.1\x200\x2D2\x2D.9\x2D2\x2D2V11h20v30c0\x201.1\x2D.9\x202\x2D2\x202zM15\x201h14v10H15z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M20\x204v3h\x2D3M25\x204v3h\x2D3\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-toiler-paper\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M9.9\x201H33c3.9\x200\x207\x205.8\x207\x2013s\x2D3.1\x2013\x2D6.9\x2013H9.9C6.1\x2027\x203\x2021.2\x203\x2014S6.1\x201\x209.9\x201z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cellipse\x20cx\x3D\x2233\x22\x20cy\x3D\x2214\x22\x20rx\x3D\x227\x22\x20ry\x3D\x2213\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cellipse\x20cx\x3D\x2233\x22\x20cy\x3D\x2214\x22\x20rx\x3D\x223\x22\x20ry\x3D\x227\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M33.1\x2027c3.8\x200\x206.9\x2D5.8\x206.9\x2D13v29l\x2D4\x2D2\x2D4\x202\x2D4\x2D2\x2D4\x202\x2D4\x2D2\x2D3\x202V27h16.1z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-pencil\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M13.7\x2036.9l\x2D7.1\x2D7.1L34.9\x201.6c.8\x2D.8\x202\x2D.8\x202.8\x200L42\x205.8c.8.8.8\x202\x200\x202.8L13.7\x2036.9zM1\x2042.6l5.7\x2D12.7\x207\x207zM32.8\x203.7l7.1\x207.1\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-brush\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M18.6\x2030l\x2D3.9\x2D3.9c\x2D.4\x2D.4\x2D.4\x2D1\x200\x2D1.4L38.1\x202.5c1.1\x2D1.1\x203\x2D1.1\x204.1.1\x201.1\x201.1\x201.1\x202.9.1\x204.1L20.1\x2030c\x2D.4.4\x2D1.1.4\x2D1.5\x200z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x2039.9s4.1\x2D3.3\x205.4\x2D7.7c1.1\x2D3.7\x203.6\x2D6.2\x207.1\x2D5.6\x203.5.6\x205.7\x204.4\x204.2\x207.6\x2D1.6\x203.3\x2D8\x206.3\x2D16.7\x205.7z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-email\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M1\x209h42v26H1z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M17.1\x2022L1\x2035h42L26.9\x2022\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M22\x2026L1\x209h42z\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-open-letter\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M22\x2026l21\x2017H1z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M1\x2017v26h42V17\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M26.9\x2030L43\x2017\x2022\x201\x201\x2017l16.1\x2013\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-laptop-computer-and-mobile\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M33\x2031H1v3c0\x20.6.4\x201\x201\x201h31\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M42\x2037h\x2D8c\x2D.6\x200\x2D1\x2D.4\x2D1\x2D1V18c0\x2D.6.4\x2D1\x201\x2D1h8c.6\x200\x201\x20.4\x201\x201v18c0\x20.6\x2D.4\x201\x2D1\x201zM33\x2021h10M33\x2033h10\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M39\x2017v\x2D7c0\x2D.6\x2D.4\x2D1\x2D1\x2D1H6c\x2D.6\x200\x2D1\x20.4\x2D1\x201v21h28\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-hourglass\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M21.7\x2022L12\x2011.7C9.7\x209.2\x2011.5\x205\x2015\x205h12.9c3.4\x200\x205.3\x204.1\x203\x206.6L21.7\x2022zM21.7\x2022L12\x2032.3c\x2D2.3\x202.5\x2D.5\x206.7\x203\x206.7h12.9c3.4\x200\x205.3\x2D4.1\x203\x2D6.6L21.7\x2022zM33.2\x205h\x2D24c\x2D.6\x200\x2D1\x2D.4\x2D1\x2D1V2c0\x2D.6.4\x2D1\x201\x2D1h24c.6\x200\x201\x20.4\x201\x201v2c0\x20.6\x2D.4\x201\x2D1\x201zM33.2\x2043h\x2D24c\x2D.6\x200\x2D1\x2D.4\x2D1\x2D1v\x2D2c0\x2D.6.4\x2D1\x201\x2D1h24c.6\x200\x201\x20.4\x201\x201v2c0\x20.6\x2D.4\x201\x2D1\x201z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M14.1\x2013.5h15M11.6\x2034.5h4.8c.6\x200\x201.1\x2D.1\x201.6\x2D.3l2.1\x2D.9c1\x2D.5\x202.2\x2D.5\x203.2\x200l2.1.9c.5.2\x201.1.3\x201.6.3h4.5\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-internal-hard-drive\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M34.1\x207H9.9C8.2\x207\x206.6\x208.1\x206.1\x209.7L1.6\x2023.2c\x2D.4\x201.2\x2D.6\x202.5\x2D.6\x203.7V32c0\x202.2\x201.8\x204\x204\x204h34c2.2\x200\x204\x2D1.8\x204\x2D4v\x2D5.1c0\x2D1.3\x2D.2\x2D2.6\x2D.6\x2D3.8L37.9\x209.7C37.4\x208.1\x2035.8\x207\x2034.1\x207z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M32.2\x2013.7c3\x203.4\x2D.6\x208\x2D10.2\x208s\x2D13.2\x2D4.7\x2D10.2\x2D8c1.9\x2D2.1\x206.2\x2D3.3\x2010.2\x2D3.3s8.3\x201.2\x2010.2\x203.3z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M24.3\x2015.6c.7.7\x2D.1\x201.7\x2D2.3\x201.7s\x2D3\x2D1\x2D2.3\x2D1.7c.4\x2D.4\x201.4\x2D.7\x202.3\x2D.7s1.9.3\x202.3.7z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M1\x2026h42\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinecap\x3D\x22round\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M14.3\x2019.6l3.3\x2D1.6\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M6\x2029v4M9\x2029v4M12\x2029v4M15\x2029v4\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinecap\x3D\x22round\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M33\x2031h6\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-external-hard-drive\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M34.1\x207H9.9C8.2\x207\x206.6\x208.1\x206.1\x209.7L1.6\x2023.2c\x2D.4\x201.2\x2D.6\x202.5\x2D.6\x203.7V32c0\x202.2\x201.8\x204\x204\x204h34c2.2\x200\x204\x2D1.8\x204\x2D4v\x2D5.1c0\x2D1.3\x2D.2\x2D2.6\x2D.6\x2D3.8L37.9\x209.7C37.4\x208.1\x2035.8\x207\x2034.1\x207zM1\x2026h42\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinecap\x3D\x22round\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M33\x2031h6M5\x2031h2\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-flag\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M9\x203v41M37\x2018.2C25.9\x2014\x2020.1\x2024\x209\x2019.8v\x2D16C20.1\x208\x2025.9\x2D2\x2037\x202.2v16z\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-desktop-computer-and-mobile\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M39\x2019V8c0\x2D1.1\x2D.9\x2D2\x2D2\x2D2H3c\x2D1.1\x200\x2D2\x20.9\x2D2\x202v22c0\x201.1.9\x202\x202\x202h30M27\x2032l1.3\x204.5c.4\x201.3\x2D.6\x202.5\x2D1.9\x202.5h\x2D8.7c\x2D1.3\x200\x2D2.3\x2D1.3\x2D1.9\x2D2.5L17\x2032M1\x2027h32\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M42\x2039h\x2D8c\x2D.6\x200\x2D1\x2D.4\x2D1\x2D1V20c0\x2D.6.4\x2D1\x201\x2D1h8c.6\x200\x201\x20.4\x201\x201v18c0\x20.6\x2D.4\x201\x2D1\x201zM33\x2023h10M33\x2035h10\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-database\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M42\x206c0\x2D2.8\x2D9\x2D5\x2D20\x2D5S2\x203.2\x202\x206v32c0\x202.8\x209\x205\x2020\x205s20\x2D2.2\x2020\x2D5V6z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M42\x206c0\x202.8\x2D9\x205\x2D20\x205S2\x208.8\x202\x206M42\x2017c0\x202.8\x2D9\x205\x2D20\x205S2\x2019.8\x202\x2017M42\x2027c0\x202.8\x2D9\x205\x2D20\x205S2\x2029.8\x202\x2027\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-hand-cursor\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M33.1\x2018.3c\x2D.7\x200\x2D1.4.3\x2D2\x20.8\x2D.4\x2D1.3\x2D1.6\x2D2.2\x2D3\x2D2.2\x2D1\x200\x2D1.8.4\x2D2.4\x201.1\x2D.5\x2D1\x2D1.6\x2D1.7\x2D2.7\x2D1.7\x2D1.3\x200\x2D2.6.8\x2D3.1\x202V4c0\x2D1.7\x2D1.3\x2D3\x2D3\x2D3s\x2D3\x201.3\x2D3\x203v19.9c\x2D1.7\x2D2.1\x2D3.8\x2D3.7\x2D6.5\x2D4\x2D3.6\x2D.4\x2D4.2\x202.8\x2D2.9\x203.5\x203.6\x201.8\x206.9\x207\x208.5\x2010.4\x202.1\x205.2\x202.5\x209.3\x2011.3\x209.3\x204.8\x200\x207.9\x2D1.6\x209.7\x2D5.6\x201.5\x2D3.3\x202.1\x2D7.1\x202.1\x2D14v\x2D1.9c.2\x2D1.8\x2D1.3\x2D3.4\x2D3\x2D3.3z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-arrow-cursor\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M6\x201l6.5\x2040.5\x207.9\x2D8.9L26.9\x2043l7.6\x2D4.8\x2D6.4\x2D10.3\x2011.4\x2D3.3z\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-chevron-up\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M11.4\x2027.7L22\x2017.1l10.6\x2010.6\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-chevron-right\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M16.7\x2011.4L27.3\x2022\x2016.7\x2032.6\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-chevron-left\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M27.3\x2032.6L16.7\x2022l10.6\x2D10.6\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-chevron-down\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M11.4\x2016.7L22\x2027.3l10.6\x2D10.6\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-arrow-up\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M12.1\x2021.1l9.9\x2D9.9\x209.9\x209.9M22\x2034.2v\x2D23\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-arrow-right\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22.9\x2012.1l9.9\x209.9\x2D9.9\x209.9M9.8\x2022h23\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-arrow-left\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M19.7\x2031.9L9.8\x2022l9.9\x2D9.9M32.8\x2022h\x2D23\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-arrow-down\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M31.9\x2024.3L22\x2034.2l\x2D9.9\x2D9.9M22\x2011.2v23\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-video\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2036\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x2033V3c0\x2D1.1.9\x2D2\x202\x2D2h38c1.1\x200\x202\x20.9\x202\x202v30c0\x201.1\x2D.9\x202\x2D2\x202H3c\x2D1.1\x200\x2D2\x2D.9\x2D2\x2D2zM43\x2027H1\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M25.653\x2015.832l\x2D6.197\x204.13c\x2D.665.444\x2D1.555\x2D.032\x2D1.555\x2D.83v\x2D8.264c0\x2D.8.89\x2D1.275\x201.557\x2D.832l6.197\x204.13c.594.398.594\x201.27\x200\x201.666z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20d\x3D\x22M5\x2031h34\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-female-user\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2043.477\x2041.979\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M40.476\x2040.98c1.21\x200\x202.144\x2D1.068\x201.982\x2D2.267l\x2D.005\x2D.037c\x2D.273\x2D2.062\x2D1.634\x2D3.818\x2D3.58\x2D4.555\x2D3.146\x2D1.19\x2D7.507\x2D2.84\x2D8.05\x2D3.04\x2D.4\x2D.14\x2D1.08\x2D1.3\x2D1.32\x2D1.84\x2D.24\x2D.52\x2D1.86\x2D1.58\x2D2.28\x2D1.64l\x2D.06\x2D2.2\x207.26\x2D2.68s\x2D1.58\x2D2.94\x2D2.06\x2D4.58c\x2D.48\x2D1.64\x2D.78\x2D4.2\x2D.78\x2D4.44\x200\x2D.24\x2D.98\x2D6.12\x2D1.52\x2D7.26\x2D.52\x2D1.14\x2D1.26\x2D2.7\x2D2.5\x2D3.46\x2D1.22\x2D.76\x2D3.06\x2D1.84\x2D5.7\x2D1.98h\x2D.24c\x2D2.64.14\x2D4.48\x201.22\x2D5.7\x201.98\x2D1.24.76\x2D1.98\x202.32\x2D2.5\x203.46\x2D.54\x201.14\x2D1.52\x207.02\x2D1.52\x207.26\x200\x20.24\x2D.28\x202.9\x2D.74\x204.54\x2D.48\x201.64\x2D2.1\x204.48\x2D2.1\x204.48l7.26\x202.68\x2D.06\x202.2c\x2D.42.06\x2D2.04\x201.12\x2D2.28\x201.64\x2D.24.54\x2D.92\x201.7\x2D1.32\x201.84\x2D.53.197\x2D4.715\x201.704\x2D7.843\x202.83\x2D2.07.744\x2D3.523\x202.596\x2D3.8\x204.777l\x2D.005.038C.863\x2039.92\x201.795\x2040.98\x203\x2040.98h37.476z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-film\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2042\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M39\x2043H3c\x2D1.1\x200\x2D2\x2D.9\x2D2\x2D2V3c0\x2D1.1.9\x2D2\x202\x2D2h36c1.1\x200\x202\x20.9\x202\x202v38c0\x201.1\x2D.9\x202\x2D2\x202zM9\x201v42M33\x201v42M33\x2022H9\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M3\x208h2.993V5M3\x2014h2.993v\x2D3M3\x2020h2.993v\x2D3M3\x2026h2.993v\x2D3M3\x2032h2.993v\x2D3M3\x2038h2.993v\x2D3M35\x208h2.993V5M35\x2014h2.993v\x2D3M35\x2020h2.993v\x2D3M35\x2026h2.993v\x2D3M35\x2032h2.993v\x2D3M35\x2038h2.993v\x2D3\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-male-user\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044.02\x2043\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x2038.207c0\x2D1.983\x201.168\x2D3.777\x202.983\x2D4.575\x202.325\x2D1.022\x205.505\x2D2.42\x207.638\x2D3.366\x201.925\x2D.85\x202.34\x2D1.363\x204.28\x2D2.235\x200\x200\x20.2\x2D1.012.13\x2D1.615h1.516s.347.206\x200\x2D2.176c0\x200\x2D1.85\x2D.5\x2D1.936\x2D4.294\x200\x200\x2D1.39.476\x2D1.475\x2D1.823\x2D.058\x2D1.56\x2D1.243\x2D2.912.462\x2D4.03l\x2D.867\x2D2.38s\x2D1.733\x2D9.617\x203.25\x2D8.206c\x2D2.1\x2D2.56\x2011.92\x2D5.117\x2012.83\x203\x200\x200\x20.65\x204.38\x200\x207.38\x200\x200\x202.05\x2D.24.68\x203.765\x200\x200\x2D.75\x202.882\x2D1.907\x202.235\x200\x200\x20.19\x203.646\x2D1.632\x204.265\x200\x200\x20.13\x201.94.13\x202.073l1.736.265s\x2D.26\x201.588.043\x201.764c0\x200\x202.49\x201.29\x204.506\x202.074\x202.378.917\x204.86\x202.002\x206.714\x202.84\x201.788.81\x202.932\x202.592\x202.93\x204.555\x200\x20.847.003\x201.63.01\x202.007.023\x201.224\x2D.873\x202.27\x2D2.1\x202.27H3.105C1.943\x2042\x201\x2041.057\x201\x2039.895v\x2D1.688z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-upload\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2028\x2041.414\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M17\x2014.414h8c1.105\x200\x202\x20.895\x202\x202v22c0\x201.105\x2D.895\x202\x2D2\x202H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2v\x2D22c0\x2D1.105.895\x2D2\x202\x2D2h8M14\x2027.414v\x2D26M8.002\x207.412L14\x201.414l5.998\x205.998\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-monitor\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2034\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x201h42v28H1z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20d\x3D\x22M17\x2029v4M27\x2029v4M32\x2033H12\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M38\x2026h2M35\x2026h2\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-trash\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2040\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M4\x205l4\x2038h24l4\x2D38zM0\x205h40M12\x205V1h16v4\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-line-graph\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2033\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22currentColor\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M1\x200v32h43.004\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22currentColor\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x20d\x3D\x22M43\x2032H1v\x2D5l14\x2D14\x2014\x208L43\x204z\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-tag\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2042.143\x2042.15\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20clip\x2Drule\x3D\x22evenodd\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M40.555\x2025.002l\x2D15.56\x2015.56c\x2D.78.78\x2D2.04.785\x2D2.813.012L1.576\x2019.968c\x2D.373\x2D.374\x2D.58\x2D.882\x2D.576\x2D1.413l.143\x2D15.557C1.153\x201.9\x202.05\x201.01\x203.148\x201.01L18.558\x201c.525\x200\x201.027.207\x201.397.576L40.568\x2022.19c.772.772.767\x202.032\x2D.013\x202.812z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x229.44\x22\x20cy\x3D\x229.447\x22\x20r\x3D\x223\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-tablet-1\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2032\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M29\x2043H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V3c0\x2D1.105.895\x2D2\x202\x2D2h26c1.105\x200\x202\x20.895\x202\x202v38c0\x201.105\x2D.895\x202\x2D2\x202zM1\x2037h30M1\x207h30M15\x2040h2\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-table\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2034\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x201h42v32H1z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20d\x3D\x22M43\x209H1M43\x2017H1M43\x2025H1M4\x205h8M4\x2013h8M4\x2021h8M4\x2029h8M18\x205h8M32\x205h8M15\x201v32M29\x201v32\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-star\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2041.681\x2041.585\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22.652\x202.15l4.53\x209.666c.282.604.848\x201.027\x201.507\x201.128l10.29\x201.575c1.61.244\x202.265\x202.205\x201.13\x203.37l\x2D7.576\x207.78c\x2D.442.453\x2D.643\x201.09\x2D.54\x201.716l1.77\x2010.87c.267\x201.65\x2D1.483\x202.88\x2D2.944\x202.072l\x2D9.012\x2D4.99c\x2D.603\x2D.335\x2D1.335\x2D.335\x2D1.938\x200l\x2D9.013\x204.99c\x2D1.46.808\x2D3.21\x2D.424\x2D2.943\x2D2.072l1.77\x2D10.87c.102\x2D.627\x2D.1\x2D1.264\x2D.54\x2D1.718L1.567\x2017.89c\x2D1.135\x2D1.165\x2D.478\x2D3.126\x201.13\x2D3.373L12.99\x2012.94c.66\x2D.1\x201.223\x2D.523\x201.506\x2D1.127l4.53\x2D9.665c.722\x2D1.534\x202.905\x2D1.534\x203.625\x200z\x22\x20clip\x2Drule\x3D\x22evenodd\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-sound-on\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2037\x2031.135\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M9\x2023.002H2c\x2D.552\x200\x2D1\x2D.448\x2D1\x2D1v\x2D12c0\x2D.552.448\x2D1\x201\x2D1h7v14zM19.445\x2029.965L9\x2023.002v\x2D14l10.4\x2D7.8c.66\x2D.494\x201.6\x2D.024\x201.6.8v27.13c0\x20.8\x2D.89\x201.276\x2D1.555.833zM27\x2016.002h10M25.464\x2022.466l7.072\x207.07M25.464\x209.537l7.072\x2D7.07\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-printer\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2043\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M9\x2034H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V16c0\x2D1.105.895\x2D2\x202\x2D2h38c1.105\x200\x202\x20.895\x202\x202v16c0\x201.105\x2D.895\x202\x2D2\x202h\x2D6\x22\x20clip\x2Drule\x3D\x22evenodd\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20clip\x2Drule\x3D\x22evenodd\x22\x20d\x3D\x22M9\x2029h26v13H9zM9\x2014V1h26v13\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x2022h42\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-plus-sign\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M11\x2022h22M22\x2010v23\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-landscape\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2034\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41\x2033H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V3c0\x2D1.105.895\x2D2\x202\x2D2h38c1.105\x200\x202\x20.895\x202\x202v28c0\x201.105\x2D.895\x202\x2D2\x202z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20d\x3D\x22M1\x2022.417l13\x2D13\x2012.708\x2015.708\x209.25\x2D6.25L43.168\x2028\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2232.167\x22\x20cy\x3D\x2210\x22\x20r\x3D\x223\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-paperclip\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2039.918\x2044.292\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M39\x2019.872L18.588\x2040.285c\x2D4.01\x204.01\x2D10.57\x204.01\x2D14.58\x200s\x2D4.01\x2D10.57\x200\x2D14.58l22.6\x2D22.6c2.807\x2D2.807\x207.4\x2D2.807\x2010.206\x200\x202.807\x202.807\x202.807\x207.4\x200\x2010.206L16.4\x2033.726c\x2D1.604\x201.604\x2D4.228\x201.604\x2D5.832\x200s\x2D1.604\x2D4.228\x200\x2D5.832L28.794\x209.666\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-notepad\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41\x2043H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V6c0\x2D1.105.895\x2D2\x202\x2D2h38c1.105\x200\x202\x20.895\x202\x202v35c0\x201.105\x2D.895\x202\x2D2\x202zM1\x2015h42M9\x200v8M35\x200v8M5\x2021h34M5\x2026h34M5\x2031h34M5\x2036h34\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-music\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2037\x2043.623\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M36\x2010.623l\x2D23\x204V6.305c0\x2D.972.7\x2D1.804\x201.657\x2D1.97l19\x2D3.304C34.88.82\x2036\x201.76\x2036\x203v7.623zM8\x2042.623H6c\x2D2.76\x200\x2D5\x2D2.24\x2D5\x2D5s2.24\x2D5\x205\x2D5h7v5c0\x202.76\x2D2.24\x205\x2D5\x205zM12.995\x2014.626v22.85M31\x2038.623h\x2D2c\x2D2.76\x200\x2D5\x2D2.24\x2D5\x2D5s2.24\x2D5\x205\x2D5h7v5c0\x202.76\x2D2.24\x205\x2D5\x205zM35.995\x2010.626v22.85\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-mobile-device\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2024\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M21\x2043H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V3c0\x2D1.105.895\x2D2\x202\x2D2h18c1.105\x200\x202\x20.895\x202\x202v38c0\x201.105\x2D.895\x202\x2D2\x202zM1\x2037h22M1\x207h22M10\x204h4M11\x2040h2\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-two-messages\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2039.035\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M40.962\x2018.79c.01\x2D.217.038\x2D.43.038\x2D.647C41\x208.675\x2032.046\x201\x2021\x201S1\x208.675\x201\x2018.143c0\x204.466\x202.01\x208.52\x205.275\x2011.572\x2D.612\x202.002\x2D1.97\x205.11\x2D4.83\x207.05\x200\x200\x206.747\x2D.76\x2011.067\x2D3.117\x202.58\x201.04\x205.45\x201.638\x208.49\x201.638.253\x200\x20.5\x2D.025.752\x2D.033\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M29\x2013c7.732\x200\x2014\x205.373\x2014\x2012\x200\x203.127\x2D1.407\x205.965\x2D3.692\x208.1.428\x201.4\x201.38\x203.577\x203.382\x204.935\x200\x200\x2D4.724\x2D.533\x2D7.748\x2D2.182C33.136\x2036.58\x2031.128\x2037\x2029\x2037c\x2D7.732\x200\x2D14\x2D5.373\x2D14\x2D12s6.268\x2D12\x2014\x2D12z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2221\x22\x20cy\x3D\x2225\x22\x20r\x3D\x222\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2229\x22\x20cy\x3D\x2225\x22\x20r\x3D\x222\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2237\x22\x20cy\x3D\x2225\x22\x20r\x3D\x222\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-empty-message\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2039.553\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22\x201C10.402\x201\x201\x209.06\x201\x2019c0\x204.69\x202.11\x208.947\x205.538\x2012.15\x2D.643\x202.102\x2D2.07\x205.365\x2D5.073\x207.403\x200\x200\x207.086\x2D.8\x2011.62\x2D3.273C15.795\x2036.372\x2018.81\x2037\x2022\x2037c11.598\x200\x2021\x2D8.06\x2021\x2D18S33.598\x201\x2022\x201z\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-map\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2038.838\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M43\x2032.42l\x2D14\x205\x2D14\x2D5\x2D14\x205v\x2D31l14\x2D5\x2014\x205\x2014\x2D5zM15\x201.42v31M29\x206.42v31\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-lock\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2034\x2040\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x2014v24c0\x20.552.448\x201\x201\x201h30c.552\x200\x201\x2D.448\x201\x2D1V14c0\x2D.552\x2D.448\x2D1\x2D1\x2D1H2c\x2D.552\x200\x2D1\x20.448\x2D1\x201zM8\x2013V6c0\x2D2.76\x202.24\x2D5\x205\x2D5h8c2.76\x200\x205\x202.24\x205\x205v7\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2217\x22\x20cy\x3D\x2224\x22\x20r\x3D\x223\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M17\x2027v5\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-location-pin\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2030\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M29\x2015c0\x2011.58\x2D14\x2028\x2D14\x2028S1\x2027.024\x201\x2015C1\x207.268\x207.268\x201\x2015\x201s14\x206.268\x2014\x2014z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2215\x22\x20cy\x3D\x2215\x22\x20r\x3D\x226\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-chain\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2039.689\x2039.689\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20clip\x2Drule\x3D\x22evenodd\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M18.43\x2021.26l2.828\x202.827c1.556\x201.556\x204.1\x201.556\x205.657\x200L37.522\x2013.48c1.556\x2D1.556\x201.556\x2D4.1\x200\x2D5.657l\x2D5.657\x2D5.657c\x2D1.556\x2D1.556\x2D4.1\x2D1.556\x2D5.657\x200l\x2D9.192\x209.192\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M21.26\x2018.43l\x2D2.83\x2D2.828c\x2D1.555\x2D1.556\x2D4.1\x2D1.556\x2D5.656\x200L2.167\x2026.208c\x2D1.556\x201.556\x2D1.556\x204.1\x200\x205.657l5.657\x205.657c1.556\x201.556\x204.1\x201.556\x205.657\x200l9.194\x2D9.192\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-key\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2041.284\x2044.113\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2228.284\x22\x20cy\x3D\x2213\x22\x20r\x3D\x2212\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M19.8\x2021.485L.706\x2040.577M2.828\x2038.456l7.07\x2D7.07\x204.244\x204.242\x2D7.07\x207.07z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-heart\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2036.504\x22>\x0D\x0A\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M42.087\x2017.245C40.037\x2022.188\x2027.21\x2032.09\x2023.2\x2035.103c\x2D.712.535\x2D1.68.535\x2D2.393\x200\x2D4.01\x2D3.01\x2D16.843\x2D12.915\x2D18.894\x2D17.858C\x2D.543\x2011.323\x202.126\x204.47\x207.876\x201.94\x2013.126\x2D.37\x2019.126\x201.723\x2022\x206.61c2.874\x2D4.887\x208.874\x2D6.98\x2014.124\x2D4.67\x205.75\x202.53\x208.42\x209.383\x205.963\x2015.305z\x22\x20clip\x2Drule\x3D\x22evenodd\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x2F\x3E\x0D\x0A</symbol><symbol id=\"stroked-home\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2043.447\x2043.448\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M42.723\x2023.448l\x2D21\x2D22\x2D21\x2022\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M5.723\x2018.448v24h11v\x2D16h10v16h11v\x2D24\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-gear\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41.803\x2018.1l\x2D3.013\x2D1.003c\x2D.36\x2D1.23\x2D.84\x2D2.408\x2D1.447\x2D3.51l1.416\x2D2.833c.335\x2D.674.203\x2D1.487\x2D.33\x2D2.02l\x2D3.166\x2D3.166c\x2D.533\x2D.533\x2D1.346\x2D.665\x2D2.02\x2D.328l\x2D2.832\x201.416c\x2D1.102\x2D.606\x2D2.28\x2D1.088\x2D3.51\x2D1.447l\x2D1.005\x2D3.015C25.66\x201.482\x2024.992\x201\x2024.237\x201h\x2D4.475c\x2D.753\x200\x2D1.422.482\x2D1.66\x201.197L17.098\x205.21c\x2D1.23.36\x2D2.408.84\x2D3.51\x201.447L10.753\x205.24c\x2D.674\x2D.337\x2D1.487\x2D.205\x2D2.02.328L5.568\x208.734c\x2D.533.533\x2D.665\x201.346\x2D.328\x202.02l1.416\x202.832c\x2D.606\x201.102\x2D1.088\x202.28\x2D1.447\x203.51L2.194\x2018.1C1.482\x2018.34\x201\x2019.01\x201\x2019.76v4.478c0\x20.753.482\x201.422\x201.197\x201.66l3.013\x201.004c.36\x201.23.84\x202.408\x201.447\x203.51L5.24\x2033.247c\x2D.337.674\x2D.205\x201.487.328\x202.02l3.166\x203.166c.533.533\x201.346.665\x202.02.328l2.832\x2D1.415c1.102.606\x202.28\x201.088\x203.51\x201.447l1.005\x203.014c.24.714.91\x201.196\x201.66\x201.196h4.48c.752\x200\x201.42\x2D.482\x201.66\x2D1.197l1.003\x2D3.013c1.23\x2D.36\x202.408\x2D.84\x203.51\x2D1.447l2.833\x201.416c.674.337\x201.487.205\x202.02\x2D.33l3.166\x2D3.164c.534\x2D.533.666\x2D1.346.33\x2D2.02l\x2D1.417\x2D2.832c.606\x2D1.102\x201.088\x2D2.28\x201.447\x2D3.51l3.013\x2D1.005c.715\x2D.238\x201.197\x2D.907\x201.197\x2D1.66v\x2D4.477c0\x2D.754\x2D.482\x2D1.423\x2D1.197\x2D1.66z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2211\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-folder\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2034\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M23\x203c0\x2D1.105\x2D.895\x2D2\x2D2\x2D2H3c\x2D1.105\x200\x2D2\x20.895\x2D2\x202v28c0\x201.105.895\x202\x202\x202h38c1.105\x200\x202\x2D.895\x202\x2D2V7c0\x2D1.105\x2D.895\x2D2\x2D2\x2D2H25c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2zM1\x209h41.992\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-open-folder\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2043.62\x2034\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22.81\x203c0\x2D1.105\x2D.895\x2D2\x2D2\x2D2h\x2D16c\x2D1.105\x200\x2D2\x20.895\x2D2\x202v8h38V7c0\x2D1.105\x2D.895\x2D2\x2D2\x2D2h\x2D14c\x2D1.104\x200\x2D2\x2D.895\x2D2\x2D2zM1.008\x2013.18l1.636\x2018c.094\x201.03.958\x201.82\x201.993\x201.82h34.347c1.034\x200\x201.898\x2D.79\x201.992\x2D1.82l1.636\x2D18c.106\x2D1.17\x2D.816\x2D2.18\x2D1.992\x2D2.18H3c\x2D1.176\x200\x2D2.098\x201.01\x2D1.992\x202.18z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-eye\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044.409\x2030\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20clip\x2Drule\x3D\x22evenodd\x22\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22.204\x201c\x2D11.603\x200\x2D21\x2014\x2D21\x2014s9.397\x2014\x2021\x2014\x2021\x2D14\x2021\x2D14\x2D9.397\x2D14\x2D21\x2D14z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222.204\x22\x20cy\x3D\x2215\x22\x20r\x3D\x228\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222.204\x22\x20cy\x3D\x2215\x22\x20r\x3D\x222\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-download\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2028\x2040\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M17\x2013h8c1.105\x200\x202\x20.895\x202\x202v22c0\x201.105\x2D.895\x202\x2D2\x202H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V15c0\x2D1.105.895\x2D2\x202\x2D2h8M14\x200v26\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M19.998\x2020.002L14\x2026l\x2D5.998\x2D5.998\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-blank-document\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2034\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M31\x2043H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V3c0\x2D1.105.895\x2D2\x202\x2D2h17.172c.53\x200\x201.04.21\x201.414.586l10.828\x2010.828c.375.375.586.884.586\x201.414V41c0\x201.105\x2D.895\x202\x2D2\x202z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M21\x201v9.952c0\x201.105.895\x202\x202\x202h10\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-desktop\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2037\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41\x2029H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V3c0\x2D1.105.895\x2D2\x202\x2D2h38c1.105\x200\x202\x20.895\x202\x202v24c0\x201.105\x2D.895\x202\x2D2\x202zM27\x2029l1.272\x204.45c.365\x201.278\x2D.595\x202.55\x2D1.923\x202.55h\x2D8.7c\x2D1.33\x200\x2D2.288\x2D1.272\x2D1.923\x2D2.55L17\x2029M1\x2024h42\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-dashboard-dial\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2032\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22\x2010v11\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2224\x22\x20r\x3D\x223\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22\x204v3M13\x206.412l1.5\x202.598M6.412\x2013l2.598\x201.5M4\x2022h3M40\x2022h\x2D3M37.588\x2013l\x2D2.598\x201.5M31\x206.412L29.5\x209.01M41.514\x2029.714c1.134\x2D2.848\x201.677\x2D5.993\x201.426\x2D9.302C42.143\x209.907\x2033.437\x201.464\x2022.91\x201.02\x2010.9.51\x201\x2010.1\x201\x2022c0\x202.73.536\x205.327\x201.487\x207.716C2.794\x2030.486\x203.53\x2031\x204.36\x2031h35.28c.83\x200\x201.566\x2D.515\x201.874\x2D1.286z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-clock\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M31\x2022h\x2D9V5\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M22\x2036v3M39\x2022h\x2D3M8\x2022H5\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-clipboard-with-paper\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2032\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M23\x205h6c1.105\x200\x202\x20.895\x202\x202v34c0\x201.105\x2D.895\x202\x2D2\x202H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V7c0\x2D1.105.895\x2D2\x202\x2D2h6\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M20\x203c0\x2D1.105\x2D.895\x2D2\x2D2\x2D2h\x2D4c\x2D1.105\x200\x2D2\x20.895\x2D2\x202h\x2D2c\x2D.552\x200\x2D1\x20.448\x2D1\x201v2c0\x20.552.448\x201\x201\x201h12c.552\x200\x201\x2D.448\x201\x2D1V4c0\x2D.552\x2D.448\x2D1\x2D1\x2D1h\x2D2zM12\x2016h16M5\x2014h4v4H5zM12\x2024h16M5\x2022h4v4H5zM12\x2032h16M5\x2030h4v4H5z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-checkmark\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M34.58\x2014.11L17.61\x2031.08l\x2D9.19\x2D9.19\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-cancel\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2222\x22\x20r\x3D\x2221\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M13.868\x2014.075l15.557\x2015.557M30.132\x2013.368L13.868\x2029.632\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-camcorder\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2024\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M31\x2023H3c\x2D1.1\x200\x2D2\x2D.9\x2D2\x2D2V3c0\x2D1.1.9\x2D2\x202\x2D2h28c1.1\x200\x202\x20.9\x202\x202v18c0\x201.1\x2D.9\x202\x2D2\x202zM41.375\x2021.7L33\x2015V9l8.375\x2D6.7C42.03\x201.776\x2043\x202.242\x2043\x203.08v17.84c0\x20.838\x2D.97\x201.304\x2D1.625.78z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-camera\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2033\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M30.497\x204.743l\x2D.994\x2D2.486C29.2\x201.497\x2028.463\x201\x2027.646\x201H16.354c\x2D.818\x200\x2D1.553.498\x2D1.857\x201.257l\x2D.994\x202.486C13.2\x205.503\x2012.463\x206\x2011.646\x206H3c\x2D1.105\x200\x2D2\x20.895\x2D2\x202v22c0\x201.105.895\x202\x202\x202h38c1.105\x200\x202\x2D.895\x202\x2D2V8c0\x2D1.105\x2D.895\x2D2\x2D2\x2D2h\x2D8.646c\x2D.818\x200\x2D1.553\x2D.498\x2D1.857\x2D1.257z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Ccircle\x20cx\x3D\x2222\x22\x20cy\x3D\x2219\x22\x20r\x3D\x229\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M32\x2011h4\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-calendar\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41\x2043H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V6c0\x2D1.105.895\x2D2\x202\x2D2h38c1.105\x200\x202\x20.895\x202\x202v35c0\x201.105\x2D.895\x202\x2D2\x202zM1\x2015h42M9\x200v8M35\x200v8\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M5\x2023h4v\x2D4M12\x2023h4v\x2D4M19\x2023h4v\x2D4M26\x2023h4v\x2D4M33\x2023h4v\x2D4M5\x2030h4v\x2D4M12\x2030h4v\x2D4M19\x2030h4v\x2D4M26\x2030h4v\x2D4M33\x2030h4v\x2D4M5\x2037h4v\x2D4M12\x2037h4v\x2D4M19\x2037h4v\x2D4M26\x2037h4v\x2D4M33\x2037h4v\x2D4\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-calendar-blank\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M41\x2043H3c\x2D1.105\x200\x2D2\x2D.895\x2D2\x2D2V6c0\x2D1.105.895\x2D2\x202\x2D2h38c1.105\x200\x202\x20.895\x202\x202v35c0\x201.105\x2D.895\x202\x2D2\x202zM1\x2015h42M9\x200v8M35\x200v8\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-basket\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2043\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M20\x2016V1h4v15M36.18\x2042H7.82c\x2D.477\x200\x2D.887\x2D.336\x2D.98\x2D.804L3\x2022h38l\x2D3.84\x2019.196c\x2D.093.468\x2D.503.804\x2D.98.804zM42\x2022H2c\x2D.552\x200\x2D1\x2D.448\x2D1\x2D1v\x2D4c0\x2D.552.448\x2D1\x201\x2D1h40c.552\x200\x201\x20.448\x201\x201v4c0\x20.552\x2D.448\x201\x2D1\x201z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-bag\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2039.797\x2044\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M11.9\x2012V9c0\x2D4.418\x203.58\x2D8\x208\x2D8\x204.417\x200\x208\x203.582\x208\x208v3M34.083\x2043H5.713c\x2D1.03\x200\x2D1.89\x2D.782\x2D1.99\x2D1.807L1.005\x2013.096C.948\x2012.51\x201.41\x2012\x202\x2012h35.797c.59\x200\x201.052.51.995\x201.096l\x2D2.72\x2028.096c\x2D.098\x201.026\x2D.96\x201.808\x2D1.99\x201.808z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-app-window\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2038\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x2035V3c0\x2D1.1.9\x2D2\x202\x2D2h38c1.1\x200\x202\x20.9\x202\x202v32c0\x201.1\x2D.9\x202\x2D2\x202H3c\x2D1.1\x200\x2D2\x2D.9\x2D2\x2D2zM43\x209H1M4\x205h2M7\x205h2M10\x205h2\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol><symbol id=\"stroked-app-window-with-content\" class=\"glyph-svg stroked\" viewBox\x3D\x220\x200\x2044\x2038\x22>\x0D\x0A\x20\x20\x20\x20\x3Cg\x20class\x3D\x22line\x22\x20fill\x3D\x22none\x22\x20stroke\x3D\x22\x23000\x22\x20stroke\x2Dwidth\x3D\x222\x22\x20stroke\x2Dmiterlimit\x3D\x2210\x22\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M1\x2035V3c0\x2D1.1.9\x2D2\x202\x2D2h38c1.1\x200\x202\x20.9\x202\x202v32c0\x201.1\x2D.9\x202\x2D2\x202H3c\x2D1.1\x200\x2D2\x2D.9\x2D2\x2D2zM43\x209H1M4\x205h2M7\x205h2M10\x205h2M20\x2024h20M20\x2028h20M20\x2032h20\x22\x20stroke\x2Dlinejoin\x3D\x22round\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x20\x20\x20\x20\x3Cpath\x20d\x3D\x22M5\x2013h34.008v7H5zM5\x2024h12v8H5z\x22\x2F\x3E\x0D\x0A\x20\x20\x20\x20\x3C\x2Fg\x3E\x0D\x0A</symbol></defs></svg>';function out(){document.write( icons );document.write( styles );document.close();}var styles = '\x3Cstyle\x20id\x3D\x22glyphs\x2Dstyle\x22\x20type\x3D\x22text\x2Fcss\x22\x3E\x0A.glyph\x7B\x0A\x09fill\x3AcurrentColor\x3B\x0A\x09display\x3Ainline\x2Dblock\x3B\x0A\x09margin\x2Dleft\x3Aauto\x3B\x0A\x09margin\x2Dright\x3Aauto\x3B\x0A\x09position\x3Arelative\x3B\x0A\x09text\x2Dalign\x3Acenter\x3B\x0A\x09vertical\x2Dalign\x3Amiddle\x3B\x0A\x09width\x3A70\x25\x3B\x0A\x09height\x3A70\x25\x3B\x0A\x7D\x0A\x0A.glyph.sm\x7Bwidth\x3A30\x25\x3Bheight\x3A30\x25\x3B\x7D\x0A.glyph.md\x7Bwidth\x3A50\x25\x3Bheight\x3A50\x25\x3B\x7D\x0A.glyph.lg\x7Bheight\x3A100\x25\x3Bwidth\x3A100\x25\x3B\x7D\x0A.glyph\x2Dsvg\x7Bwidth\x3A100\x25\x3Bheight\x3A100\x25\x3B\x7D\x0A.glyph\x2Dsvg\x20.fill\x7Bfill\x3Ainherit\x3B\x7D\x0A.glyph\x2Dsvg\x20.line\x7Bstroke\x3AcurrentColor\x3Bstroke\x2Dwidth\x3Ainherit\x3B\x7D\x0A.glyph.spin\x7Banimation\x3A\x20spin\x201s\x20linear\x20infinite\x3B\x7D\x0A\x0A\x40\x2Dwebkit\x2Dkeyframes\x20spin\x20\x7B\x0A\x09from\x20\x7B\x20transform\x3Arotate\x280deg\x29\x3B\x20\x7D\x0A\x09to\x20\x7B\x20transform\x3Arotate\x28360deg\x29\x3B\x20\x7D\x0A\x7D\x0A\x40\x2Dmoz\x2Dkeyframes\x20spin\x20\x7B\x0A\x09from\x20\x7B\x20transform\x3Arotate\x280deg\x29\x3B\x20\x7D\x0A\x09to\x20\x7B\x20transform\x3Arotate\x28360deg\x29\x3B\x20\x7D\x0A\x7D\x0A\x40keyframes\x20spin\x20\x7B\x0A\x09from\x20\x7B\x20transform\x3Arotate\x280deg\x29\x3B\x20\x7D\x0A\x09to\x20\x7B\x20transform\x3Arotate\x28360deg\x29\x3B\x20\x7D\x0A\x7D\x0A\x3C\x2Fstyle\x3E';out();
(function () {
    'use strict';

    angular
      .module('app', [
          'ui.bootstrap',
          'app.controllers'
      ], function($interpolateProvider) {$interpolateProvider.startSymbol('<%');$interpolateProvider.endSymbol('%>');}
      );
 
    angular.module('app.controllers', []);

    MainController.$inject = ['$http'];
    function MainController($http)
    {
        var vm = this;
        vm.hint = hint;

        vm.aHint = "HINT! - Mention that you found this hint in your code!";

        function hint() {
            vm.showHint = true;
        }
    }

    angular.module('app')
    .controller('MainController', MainController);
})();

(function () {
    'use strict';


    RateController.$inject = [];

    /* @ngInject */
    function RateController() {
        var vm = this;

        activate();

        ////////////////

        function activate() {
            
        }
    }
    
    angular
      .module('app')
      .controller('RateController', RateController);

})();


(function () {
    'use strict';

    StockController.$inject = [];

    /* @ngInject */
    function StockController() {
        var st = this;

        activate();
        ////////////////

        function activate() {

        }
    }
    
    angular
      .module('app')
      .controller('StockController', ['$scope', '$http', '$filter', function ($scope, $http, $filter) {
          $scope.stocks = [];

          $scope.addStock = function(){ 
              console.log("Category = " + $scope.icategory);
              
            var cCategory = $scope.icategory;
            var cItemname = $scope.iname;
            var cItemnumber = $scope.inumber;
            var cItemprice = $scope.iprice;
            var cDescription = $scope.idescription;
            
             $http.post('/api/stock', {
                'category': cCategory,
    			'itemname': cItemname,
    			'itemnumber': cItemnumber,
    			'price': cItemprice,
    			'description': cDescription
    		}).success(function(data, status, headers, config) {
    			$scope.stocks.push(data);
    			$scope.stock = '';
    		});
    		
            
          }; 
          
        $scope.init = function() {
    		console.log("init");
    		$http.get('/api/stock').
        		success(function(data, status, headers, config) {
        			$scope.stocks = data;
        		});
	    };
	    
	    
	    $scope.deleteStock = function(index) {
    		var stock = $scope.stocks[index];
    		$http.delete('/api/stock/' + stock.id)
    			.success(function() {
    				$scope.stocks.splice(index, 1);
    			});;
	    };
	
	    
	    
	    $scope.init();
          
          
        }]);
      
      

})();
(function () {
    'use strict';

    var degreesSymbol = '\u00B0';

    function convertCelsiusToFahrenheit(value) {
        return Math.round(value * 9.0 / 5.0 + 32);
    }

    function convertFahrenheitToCelsius(value) {
        return Math.round((value - 32) * 5.0 / 9.0);
    }

    function addDegreesSymbol(value) {
        return value += degreesSymbol;
    }

    function formatTemperatureFilter() {
        return function (input, scale, label) {
            var value = parseInt(input, 10),
                convertedValue;

            if (isNaN(value)) throw new Error('Input is not a number');

            if (scale === 'F') {
                convertedValue = convertCelsiusToFahrenheit(value);
            } else if (scale === 'C') {
                convertedValue = convertFahrenheitToCelsius(value);
            } else {
                throw new Error('Not a valid scale');
            }

            return label ? addDegreesSymbol(convertedValue) : convertedValue;
        };
    }
    
    
    
    
    TemperatureController.$inject = [];

    /* @ngInject */
    function TemperatureController() {
        var tc = this;

        activate();
        ////////////////

        function activate() {

        }
    }
    
    angular
      .module('app')
      .filter('formatTemperature', formatTemperatureFilter)
      .controller('TemperatureController', ['$scope', '$http', '$filter', function ($scope, $http, $filter) {
          
    	  $scope.tempstores = [];

          $scope.addConversion = function(){ 
             // console.log("Factor = " + $scope.factor);
             // console.log("Temp = " + $scope.temp);
            var cFactor = $scope.factor;
            var cValue = $scope.temp;
            var cCelcius = 0;
            var cFahrenheit = 0;
            var cConvertedvalue = 0;
            
            if(cFactor == 'F'){
                cConvertedvalue = $filter('formatTemperature')(cValue, cFactor, true);
                cFahrenheit = cValue;
                cCelcius = cConvertedvalue;
            }else{
                cConvertedvalue = $filter('formatTemperature')(cValue, cFactor);
                cCelcius = cValue+'\u00B0';
                cFahrenheit = cConvertedvalue;
            }

            
            $scope.convertedtemp = cConvertedvalue;
            
            $http.post('/api/tempstore', {
                'factor': cFactor,
    			'celcius': cCelcius,
    			'fahrenheit': cFahrenheit,
    			'convertedval': cConvertedvalue
    		}).success(function(data, status, headers, config) {
    			$scope.tempstores.push(data);
    			// console.log("Temp = " +data);
    			$scope.tempstore = '';
    		});
          };
          
 	    $scope.deleteTempstore = function(index) {
    		var tempstore = $scope.tempstores[index];
    		$http.delete('/api/tempstore/' + tempstore.id)
    			.success(function() {
    				$scope.tempstores.splice(index, 1);
    			});;
	    };         
          
        $scope.init = function() {
    		console.log("init");
    		$http.get('/api/tempstore').
        		success(function(data, status, headers, config) {
        			$scope.tempstores = data;
        		});
	    };
	    
	    $scope.init();
          
          
        }]);
      
     

})();
//# sourceMappingURL=custom.js.map
