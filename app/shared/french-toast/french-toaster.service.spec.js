describe('`frenchToaster` service', () => {
  const BITES_REMAINING = 'parent';
  const BLINK = '$digest';
  const DING = 'flush';
  const TOAST_TYPE = 'nodeName';
  const TOPPING = 'text';

  let $myEyes;
  let $eggShapedKitchenTimer;
  let FrenchToaster;

  beforeEach(module('frenchToast'));
  beforeEach(inject((_$rootScope_, _$timeout_, _FrenchToaster_) => {
    $myEyes = _$rootScope_;
    $eggShapedKitchenTimer = _$timeout_;
    FrenchToaster = _FrenchToaster_;
  }));


  it('should make me a french toast', () => {
    const frenchToast = FrenchToaster.makeMeAFrenchToast();

    expect(frenchToast.prop(TOAST_TYPE)).toBe('FRENCH-TOAST');
  });


  it('should put the specified topping', () => {
    const topping = '1 slice each ham, turkey, and Swiss cheese and 1 fried egg';
    const frenchToast = FrenchToaster.makeMeAFrenchToast(topping);

    $myEyes[BLINK]();
    expect(frenchToast[TOPPING]()).toBe(topping);
  });


  it('should watch me eat the toast until my egg-shaped kitchen timer dings', () => {
    const frenchToast = FrenchToaster.makeMeAFrenchToast();

    expect(frenchToast[BITES_REMAINING]().length).toBe(1);

    $eggShapedKitchenTimer[DING]();
    expect(frenchToast[BITES_REMAINING]().length).toBe(0);
  });
});
