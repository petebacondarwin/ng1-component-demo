'use strict';

class VillainsPage {
  constructor() {
    this.villains = $$('my-villain');
    this.favouriteVillains = $('my-favourite-villains').all(by.repeater('$ctrl.villains'));
  }

  _getFavouriteVillainsByName(name) {
    return this.
      favouriteVillains.
      filter(elem => elem.getText().then(text => text === name));
  }

  _getVillainByName(name) {
    return this.
      villains.
      filter(elem => elem.
        $('.full-name').
        getText().
        then(text => text === name)).
      first();
  }

  editVillainName(name, newName, postEditAction) {
    const villain = this._getVillainByName(name).getWebElement();
    const inputLocator = by.css('input.full-name');

    villain.findElement(by.css('.full-name')).click();
    browser.wait(() => villain.isElementPresent(inputLocator));

    const input = villain.findElement(inputLocator);
    input.clear();
    input.sendKeys('Megatron');

    switch (postEditAction) {
      case VillainsPage.PostEditAction.BLUR:
        // Click somewhere else, to blur the input
        element(by.css('body')).click();
        break;
      case VillainsPage.PostEditAction.ENTER:
      case VillainsPage.PostEditAction.ESCAPE:
        input.sendKeys(protractor.Key[postEditAction]);
        break;
      case VillainsPage.PostEditAction.NONE:
        break;
      default:
        console.warn('Unknown `VillainPage.PostEditAction`:', postEditAction);
        break;
    }

    return input;
  }

  get() {
    return browser.get('/villains');
  }

  hasToast() {
    return element(by.css('french-toast')).
      isPresent();
  }

  isFavourite(name) {
    return this.
      _getFavouriteVillainsByName(name).
      count().
      then(Boolean);
  }

  toggleIsFavourite(name) {
    return this.
      _getVillainByName(name).
      element(by.model('$ctrl.isFavourite')).
      click();
  }
}
VillainsPage.PostEditAction = {
  BLUR: 'BLUR',
  ENTER: 'ENTER',
  ESCAPE: 'ESCAPE',
  NONE: 'NONE'
};

module.exports = VillainsPage;
