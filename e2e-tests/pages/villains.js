'use strict';

function VillainsPage() {
  this.villains = $$('my-villain');
  this.favouriteVillains = $('my-favourite-villains').all(by.repeater('$ctrl.villains'));
}

VillainsPage.prototype._getFavouriteVillainsByName = function(name) {
  return this.
    favouriteVillains.
    filter(function(elem) { return elem.getText().then(function(text) { return text === name; }); });
};

VillainsPage.prototype._getVillainByName = function(name) {
  return this.
    villains.
    filter(function(elem) {
      return elem.
        $('.full-name').
        getText().
        then(function(text) { return text === name; })
    }).
    first();
};

VillainsPage.prototype.editVillainName = function(name, newName, postEditAction) {
  var villain = this._getVillainByName(name).getWebElement();
  var inputLocator = by.css('input.full-name');

  villain.findElement(by.css('.full-name')).click();
      browser.wait(function() { return villain.isElementPresent(inputLocator); });

  var input = villain.findElement(inputLocator);
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
};

VillainsPage.prototype.get = function() {
  return browser.get('/villains');
};

VillainsPage.prototype.isFavourite = function(name) {
  return this.
    _getFavouriteVillainsByName(name).
    count().
    then(Boolean);
};

VillainsPage.prototype.toggleIsFavourite = function(name) {
  return this.
    _getVillainByName(name).
    element(by.model('$ctrl.isFavourite')).
    click();
};

VillainsPage.PostEditAction = {
  BLUR: 'BLUR',
  ENTER: 'ENTER',
  ESCAPE: 'ESCAPE',
  NONE: 'NONE'
};

module.exports = VillainsPage;
