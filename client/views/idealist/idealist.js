define('ideaListView', function(){
    var ideaListView = (function() {
        return {
            initialize: function() {
                alert('loaded!');
            }
        }
    }());

    Template.ideaList.rendered = ideaListView.initialize.bind(ideaListView);
});