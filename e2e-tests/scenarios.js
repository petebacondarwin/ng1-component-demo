'use strict';

var VillainsPage = require('./pages/villains');

describe('The Villains App', function() {
  describe('The `EditVillains` page', function() {
    var page;

    beforeEach(function() {
      page = new VillainsPage();
      page.get();
    });


    describe('All villains', function() {
      it('should show a list of all villains', function() {
        expect(page.villains.count()).toBe(4);
      });


      it('should allow liking/unliking a villain', function() {
        expect(page.isFavourite('Poison Ivy')).toBe(false);

        page.toggleIsFavourite('Poison Ivy');
        expect(page.isFavourite('Poison Ivy')).toBe(true);

        page.toggleIsFavourite('Poison Ivy');
        expect(page.isFavourite('Poison Ivy')).toBe(false);
      });


      describe('Editing a villain\'s name', function() {

        it('should save the name on <BLUR>', function() {
          expect(page.isFavourite('Doctor Octopus')).toBe(true);
          expect(page.isFavourite('Megatron')).toBe(false);

          page.editVillainName('Doctor Octopus', 'Megatron', VillainsPage.PostEditAction.BLUR);

          expect(page.isFavourite('Doctor Octopus')).toBe(false);
          expect(page.isFavourite('Megatron')).toBe(true);
        });


        it('should save the name on <ENTER>', function() {
          expect(page.isFavourite('Doctor Octopus')).toBe(true);
          expect(page.isFavourite('Megatron')).toBe(false);

          page.editVillainName('Doctor Octopus', 'Megatron', VillainsPage.PostEditAction.ENTER);

          expect(page.isFavourite('Doctor Octopus')).toBe(false);
          expect(page.isFavourite('Megatron')).toBe(true);
        });


        it('should restore the name on <ESCAPE>', function() {
          expect(page.isFavourite('Doctor Octopus')).toBe(true);
          expect(page.isFavourite('Megatron')).toBe(false);

          page.editVillainName('Doctor Octopus', 'Megatron', VillainsPage.PostEditAction.ESCAPE);

          expect(page.isFavourite('Doctor Octopus')).toBe(true);
          expect(page.isFavourite('Megatron')).toBe(false);
        });
      });
    });


    describe('My favourite villains', function() {
      it('should show a list of my favourite villains', function() {
        expect(page.favouriteVillains.count()).toBe(2);
      });
    });
  });
});
