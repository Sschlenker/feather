﻿describe('tree directive', function () {
    beforeEach(module('sfTree'));

    var $rootScope;
    var $q;
    var templateCache;

    beforeEach(inject(function (_$rootScope_, _$q_, $templateCache) {
        $rootScope = _$rootScope_;
        $q = _$q_;
        templateCache = $templateCache;
    }));

    it('[Boyko-Karadzhov] / should request items initially once with null parent.', function () {
        var scope = $rootScope.$new();
        var childrenRequestedCount = 0;
        var requestedParent = 'not null';

        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/dummy.html', '');

        scope.requestChildren = function (parent) {
            childrenRequestedCount++;
            requestedParent = parent;

            var result = $q.defer();
            result.resolve([]);
            return result.promise;
        };
        
        var directiveMarkup = '<div sf-tree sf-template-url="sf-tree/dummy.html" sf-request-children="requestChildren(parent)"></div>';
        commonMethods.compileDirective(directiveMarkup, scope);

        expect(childrenRequestedCount).toEqual(1);
        expect(requestedParent).toEqual(null);
    });

    it('[Boyko-Karadzhov] / should request children for item when expanded.', function () {
        var scope = $rootScope.$new();
        var requestedParent = null;
        var requestedWithParentCount = 0;

        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/expand-item.html', '<span ng-click="toggle(node)">{{node.item.Id}}</span><ul><li ng-repeat="node in node.children" ng-include src="itemTemplateUrl"></li></ul>');
        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/expand.html', '<ul><li ng-repeat="node in hierarchy" ng-include src="itemTemplateUrl"></li></ul>');

        scope.requestChildren = function (parent) {
            var result = $q.defer();

            if (!parent) {
                result.resolve([{ Id: '1' }, { Id: '2' }]);
            }
            else {
                result.resolve([]);
                requestedParent = parent;
                requestedWithParentCount++;
            }

            return result.promise;
        };

        var directiveMarkup = '<div sf-tree sf-template-url="sf-tree/expand.html" sf-item-template-url="sf-tree/expand-item.html" sf-request-children="requestChildren(parent)"></div>';
        commonMethods.compileDirective(directiveMarkup, scope);

        $('ul li span:contains("2")').click();
        scope.$digest();

        expect(requestedWithParentCount).toEqual(1);
        expect(requestedParent).not.toBe(null);
        if (requestedParent)
            expect(requestedParent.Id).toEqual('2');
    });

    it('[Boyko-Karadzhov] / should mark preselected item bound by ng-model as selected.', function () {
        var scope = $rootScope.$new();
        scope.selectedId = '3';

        selectionSetup(scope);

        expect($('span:contains("1")').is('.selected')).toBe(false);
        expect($('span:contains("2")').is('.selected')).toBe(false);

        $('ul li span:contains("2") a.expander').click();
        scope.$digest();

        expect($('span:contains("2")').is('.selected')).toBe(false);
        expect($('span:contains("3")').is('.selected')).toBe(true);
    });

    it('[Boyko-Karadzhov] / should mark as collapsed all initially loaded items.', function () {
        var scope = $rootScope.$new();

        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/expand-item.html', '<span ng-click="toggle(node)" ng-class="{ \'collapsed\': node.collapsed }">{{node.item.Id}}</span><ul><li ng-repeat="node in node.children" ng-include src="itemTemplateUrl"></li></ul>');
        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/expand.html', '<ul><li ng-repeat="node in hierarchy" ng-include src="itemTemplateUrl"></li></ul>');

        scope.requestChildren = function (parent) {
            var result = $q.defer();
            result.resolve([{ Id: '1' }, { Id: '2' }]);

            return result.promise;
        };

        var directiveMarkup = '<div class="initialMarkCollapsed" sf-tree sf-template-url="sf-tree/expand.html" sf-item-template-url="sf-tree/expand-item.html" sf-request-children="requestChildren(parent)"></div>';
        commonMethods.compileDirective(directiveMarkup, scope);
        scope.$digest();

        expect($('div.initialMarkCollapsed span.collapsed').length).toEqual(2);
    });

    it('[Boyko-Karadzhov] / should set the bound property in ng-model to the currently selected item.', function () {
        var scope = $rootScope.$new();
        scope.selectedId = '3';

        selectionSetup(scope);

        $('ul li span:contains("2") a.expander').click();
        scope.$digest();

        $('ul li span:contains("2") a.selector').click();
        scope.$digest();

        expect(scope.selectedId).toEqual('2');
    });

    it('[Boyko-Karadzhov] / should expand on select when sfExpandOnSelect is set.', function () {
        var scope = $rootScope.$new();
        scope.selectedId = '3';

        selectionSetup(scope, '<div sf-tree ng-model="selectedId" sf-template-url="sf-tree/expand.html" sf-item-template-url="sf-tree/selected-item.html" sf-request-children="requestChildren(parent)" sf-identifier="id" sf-expand-on-click></div>');

        $('ul li span:contains("2") a.selector').click();
        scope.$digest();

        expect(scope.selectedId).toEqual('2');
        expect($('ul li span:contains("2")').is('.collapsed')).toBe(true);
    });

    it('[dzhenko] / should deselect item if clicked for the second time if the tree has sf-deselectable attribute.', function () {
        var scope = $rootScope.$new();
        scope.selectedId = '1';

        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/selected-item.html', '<span ng-class="{ \'selected\': isSelected(node), \'collapsed\': node.collapsed }">{{node.item.id}}<a ng-click="toggle(node)" class="expander"></a><a class="selector" ng-click="select(node)"></a></span><ul><li ng-repeat="node in node.children" ng-include src="itemTemplateUrl"></li></ul>');
        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/expand.html', '<ul ><li ng-repeat="node in hierarchy" ng-include src="itemTemplateUrl"></li></ul>');

        scope.requestChildren = function (parent) {
            var result = $q.defer();

            if (parent === null) {
                result.resolve([{ id: '1' }, { id: '2' }]);
            }
            else if (parent.id === '2') {
                result.resolve([{ id: '3' }, { id: '4' }]);
            }
            else {
                result.resolve([]);
            }

            return result.promise;
        };

        var directiveMarkup = directiveMarkup || '<div sf-tree ng-model="selectedId" sf-deselectable sf-template-url="sf-tree/expand.html" sf-item-template-url="sf-tree/selected-item.html" sf-request-children="requestChildren(parent)" sf-identifier="id"></div>';
        commonMethods.compileDirective(directiveMarkup, scope);

        expect(scope.selectedId).toEqual('1');

        $('ul li span:contains("1") a.selector').click();
        scope.$digest();

        expect(scope.selectedId).toEqual(null);
    });

    it('[dzhenko] / should deselect item if clicked for the second time if the tree is missing sf-deselectable attribute.', function () {
        var scope = $rootScope.$new();
        scope.selectedId = '1';

        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/selected-item.html', '<span ng-class="{ \'selected\': isSelected(node), \'collapsed\': node.collapsed }">{{node.item.id}}<a ng-click="toggle(node)" class="expander"></a><a class="selector" ng-click="select(node)"></a></span><ul><li ng-repeat="node in node.children" ng-include src="itemTemplateUrl"></li></ul>');
        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/expand.html', '<ul ><li ng-repeat="node in hierarchy" ng-include src="itemTemplateUrl"></li></ul>');

        scope.requestChildren = function (parent) {
            var result = $q.defer();

            if (parent === null) {
                result.resolve([{ id: '1' }, { id: '2' }]);
            }
            else if (parent.id === '2') {
                result.resolve([{ id: '3' }, { id: '4' }]);
            }
            else {
                result.resolve([]);
            }

            return result.promise;
        };

        var directiveMarkup = directiveMarkup || '<div sf-tree ng-model="selectedId" sf-template-url="sf-tree/expand.html" sf-item-template-url="sf-tree/selected-item.html" sf-request-children="requestChildren(parent)" sf-identifier="id"></div>';
        commonMethods.compileDirective(directiveMarkup, scope);

        expect(scope.selectedId).toEqual('1');

        $('ul li span:contains("1") a.selector').click();
        scope.$digest();

        expect(scope.selectedId).toEqual('1');
    });

    var selectionSetup = function (scope, directiveMarkup) {
        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/selected-item.html', '<span ng-class="{ \'selected\': isSelected(node), \'collapsed\': node.collapsed }">{{node.item.id}}<a ng-click="toggle(node)" class="expander"></a><a class="selector" ng-click="select(node)"></a></span><ul><li ng-repeat="node in node.children" ng-include src="itemTemplateUrl"></li></ul>');
        templateCache.put('/Frontend-Assembly/Telerik.Sitefinity.Frontend/sf-tree/expand.html', '<ul ><li ng-repeat="node in hierarchy" ng-include src="itemTemplateUrl"></li></ul>');

        scope.requestChildren = function (parent) {
            var result = $q.defer();

            if (parent === null) {
                result.resolve([{ id: '1' }, { id: '2' }]);
            }
            else if (parent.id === '2') {
                result.resolve([{ id: '3' }, { id: '4' }]);
            }
            else {
                result.resolve([]);
            }

            return result.promise;
        };

        var directiveMarkup = directiveMarkup || '<div sf-tree ng-model="selectedId" sf-template-url="sf-tree/expand.html" sf-item-template-url="sf-tree/selected-item.html" sf-request-children="requestChildren(parent)" sf-identifier="id"></div>';
        commonMethods.compileDirective(directiveMarkup, scope);
    };
});