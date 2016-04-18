describe('`frenchToast` component', () => {
  const DING = 'flush';
  const MIX = '$digest';
  const TOPPING = 'text';

  let $cook;
  let $ingredients;
  let $eggShapedKitchenTimer;

  beforeEach(module('frenchToast.component'));
  beforeEach(inject((_$compile_, _$rootScope_, _$timeout_) => {
    $cook = _$compile_;
    $ingredients = _$rootScope_;
    $eggShapedKitchenTimer = _$timeout_;
  }));


  it('should have a topping', () => {
    $ingredients.topping = '1 slice each ham, turkey, and Swiss cheese and 1 fried egg';
    const recipe = '<french-toast topping="topping"></french-toast>';

    const frenchToast = $cook(recipe)($ingredients);

    $ingredients[MIX]();
    expect(frenchToast[TOPPING]()).toBe($ingredients.topping);
  });


  it('should notify when ready', () => {
    let wasYammy = false;

    $ingredients.yammyYammy = () => wasYammy = true;
    const recipe = '<french-toast when-ready="yammyYammy()"></french-toast>';

    const frenchToast = $cook(recipe)($ingredients);

    expect(wasYammy).toBe(false);

    $eggShapedKitchenTimer[DING]();
    expect(wasYammy).toBe(true);
  });
});
