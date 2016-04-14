describe('myVillain component', function() {

  describe('$onChanges(changes)', function() {
    it('should update the fullName property if the change is a villain change', function() {
      var $ctrl = getComponentController();
      $ctrl.$onChanges({
        villain: {
          currentValue: { id: 2, firstName: 'Bat', lastName: 'Girl' }
        }
      });
      expect($ctrl.fullName).toEqual('Bat Girl');
    });
  });

  describe('nameChanged()', function() {
    it('should call the onVillainChanged output binding, with the name info', function() {
      var $ctrl = getComponentController();
      $ctrl.onVillainChange = jasmine.createSpy('onVillainChanged');
      $ctrl.fullName = 'Wonder Woman';
      $ctrl.nameChanged();
      expect($ctrl.onVillainChange).toHaveBeenCalledWith({
        $event: { firstName: 'Wonder', lastName: 'Woman' }
      });
    });
  });

  describe('handleKey($event)', function() {
    describe('ESC key', function() {
      it('should reset the full name to that of the current villain object', function() {
        var $ctrl = getComponentController();
        $ctrl.villain = { firstName: 'Super', lastName: 'Man' };
        $ctrl.fullName = 'Clark Kent';
        var $event = createKeyEvent(27);
        $ctrl.handleKey($event);
        expect($ctrl.fullName).toEqual('Super Man');
        expect($event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('ENTER key', function() {
      it('should call nameChanged()', function() {
        var $ctrl = getComponentController();
        spyOn($ctrl, 'nameChanged');
        var $event = createKeyEvent(13);
        $ctrl.handleKey($event);
        expect($ctrl.nameChanged).toHaveBeenCalled();
        expect($event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('other keys', function() {
      it('should not prevent the default event', function() {
        var $ctrl = getComponentController();
        var $event = createKeyEvent(42);
        $ctrl.handleKey($event);
        expect($event.preventDefault).not.toHaveBeenCalled();
      });
    });
  });

  function getComponentController() {
    var $ctrl;
    module('myVillain.component');
    inject(function($componentController) {
      $ctrl = $componentController('myVillain');
    });
    return $ctrl;
  }

  function createKeyEvent(keyCode) {
      return { keyCode: keyCode, preventDefault: jasmine.createSpy('preventDefault') };
  }

});
