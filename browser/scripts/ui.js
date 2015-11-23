// require ui-core.js

VizorUI.prototype.setupEventHandlers = function(e2, dom) {
	if (typeof e2 === 'undefined') return false;

	dom = dom || this.dom;
	e2.app.openPresetSaveDialog = this.openPresetSaveDialog.bind(e2.app);

	var that = this;

	// menu shell
	dom.btnSignIn.click(VizorUI.openLoginModal);

	dom.btnAssets.click(this.onBtnAssetsClicked.bind(this));
	dom.btnPresets.click(this.onBtnPresetsClicked.bind(this));
	dom.btnChatDisplay.click(this.onBtnChatClicked.bind(this));
	dom.btnHideAll.click(this.onBtnHideAllClicked.bind(this));
	dom.btnInspector.click(this.onInspectorClicked.bind(this));
	dom.btnEditorCam.click(this.enterEditorView.bind(this));

	dom.btnVRCam.click(this.enterVRView.bind(this));


	var makeTabHandler = function(panelStateKey) {
		return function(e) {
			var $li = jQuery(e.currentTarget).parent();
			var s = this.state.panelStates[panelStateKey];
			var stateChanged = false;
			if (s.collapsed) {
				s.collapsed = false;
				stateChanged = true;
			}
			if (!$li.hasClass('active')) {
				s.selectedTab = '#' + e.currentTarget.href.split('#')[1];	// link
				stateChanged = true;
			}
			if (stateChanged)
				this.state.panelStates[panelStateKey] = s;
			if (e) {
				e.preventDefault();
			}
			return false;
		}.bind(that);
	};

	jQuery('ul.nav-tabs a', dom.chatWindow).click(makeTabHandler('chat'));
	jQuery('ul.nav-tabs a', dom.presetsLib).click(makeTabHandler('presets'));
	jQuery('ul.nav-tabs a', dom.assetsLib).click(makeTabHandler('assets'));

	var makeToggleHandler = function(panelStateKey) {
		return function(e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			var newState = this.state.panelStates[panelStateKey] || {}
			newState.collapsed = !newState.collapsed
			this.state.panelStates[panelStateKey] = newState
			return false;
		}.bind(that);
	};
	dom.chatToggleButton.click(makeToggleHandler('chat'));
	dom.assetsToggle.click(makeToggleHandler('assets'));
	dom.presetsToggle.click(makeToggleHandler('presets'));

	dom.assetsClose.click(this.closePanelAssets.bind(this));
	dom.presetsClose.click(this.closePanelPresets.bind(this));
	dom.chatClose.click(this.closePanelChat.bind(this));

	dom.btnBuildMode.click(this.setModeBuild.bind(this));
	dom.btnProgramMode.click(this.setModeProgram.bind(this));

	dom.publishButton.click(function() {
		E2.app.onPublishClicked()
	});

	var updatePanelState = function(which, domElement) {
		that.state.panelStates[which] = VizorUI.getDomPanelState(domElement);
	}
	// drag handlers, for when the panels are dragged
	dom.assetsLib.on(uiEvent.moved, function(){  updatePanelState('assets', dom.assetsLib)   });
	dom.presetsLib.on(uiEvent.moved, function(){ updatePanelState('presets', dom.presetsLib) });
	dom.chatWindow
		.on(uiEvent.moved, function() {
			updatePanelState('chat', dom.chatWindow)
		})
		.on(uiEvent.resized, function(){
			updatePanelState('chat', dom.chatWindow);
		})
		.find('.resize-handle')
		.on('mousemove touchmove', that.onChatResize.bind(that))

	var switchModifyMode = function(modifyMode){
		return function(e){
			e.preventDefault();
			e.stopPropagation();
			that.state.modifyMode = modifyMode;
			return false;
		}
	}
	dom.btnMove.on('mousedown', switchModifyMode(uiModifyMode.move));
	dom.btnRotate.on('mousedown', switchModifyMode(uiModifyMode.rotate));
	dom.btnScale.on('mousedown', switchModifyMode(uiModifyMode.scale));

};

VizorUI.prototype.init = function(e2) {	// normally the global E2 object
	e2.app.onWindowResize();

	this._init(e2);

	var that = this;
	var dom = this.dom;


	this.state.panelStates.assets = VizorUI.getDomPanelState(dom.assetsLib);
	this.state.panelStates.presets = VizorUI.getDomPanelState(dom.presetsLib);
	this.state.panelStates.chat = VizorUI.getDomPanelState(dom.chatWindow);


	dom.btnBuildMode = $('#buildModeBtn');
	dom.btnProgramMode = $('#programModeBtn');
	dom.btnMove = $('#btn-move');
	dom.btnScale = $('#btn-scale');
	dom.btnRotate = $('#btn-rotate');
	dom.btnHideAll = $('#btn-hide-all');


	var presetsTabs = jQuery('#presets-lib div.block-header ul.nav-tabs li');
	dom.tabPresets = presetsTabs.find("a[href='#presets']").parent();
	dom.tabObjects = presetsTabs.find("a[href='#objects']").parent();

	var shaderBlock = $('.shader-block')
	shaderBlock.movable()

	dom.presetsLib.movable();
	dom.assetsLib.movable();

	var chatUsersHeight = jQuery('.chat-users').height();

	var bottomPanelHeight = jQuery('.bottom-panel').height();
	var editorHeaderHeight = jQuery('.editor-header').height();
	var breadcrumbHeight = jQuery('#breadcrumb').height();
	var chatTop = $(window).height() - chatUsersHeight - bottomPanelHeight - 40;

	if (chatTop < (editorHeaderHeight + breadcrumbHeight)) {
		chatTop = breadcrumbHeight + breadcrumbHeight + 40;
	}
	dom.chatWindow.css({'top': chatTop});
	dom.chatWindow.movable();

	this.initDropUpload();
	this.setPageTitle();


	dom.structure.addClass('scrollbar'); // #805
	dom.menubar = jQuery('div.menu-bar')

	VizorUI.replaceSVGButtons(dom.menubar);
	VizorUI.replaceSVGButtons(jQuery('#row2'));

	this.state.recall();

	if (dom.assetsLib.length < 1) this.state.visibility.panel_assets = false;

	this.setupEventHandlers(e2,this.dom);
	this.setupStateStoreEventListeners();
	this.state.allowStoreOnChange = true;

	this._initialised = true;

	this.emit(uiEvent.initialised, this);
}



/***** LOADING *****/
VizorUI.prototype.setLoadingStatus = function(is_loading) {}
VizorUI.prototype.hideLoadingIndicator = function() {
	this.updateProgressBar(100);
}
VizorUI.prototype.showLoadingIndicator = function() {
	this.updateProgressBar(10);
}

VizorUI.prototype.setPageTitle = function() {
	var isLoggedIn = E2.models.user.get('username');
	if (!isLoggedIn)
		return false;

	var graphname = E2.app.path;
	var newTitle = "Vizor";

	graphname = graphname.split('/')
	if (graphname.length > 1)
		graphname=graphname[1];
	
	newTitle = graphname + " | " + newTitle;	
	document.title = newTitle;
	return newTitle;
}


/***** MODAL DIALOGS/WINDOWS *****/


VizorUI.prototype.openPublishGraphModal = function() {
	var dfd = when.defer()
	var that = this;
	var publishTemplate = E2.views.filebrowser.publishModal;
	var graphname = E2.app.path.split('/')
    if (graphname.length > 1)
        graphname = graphname[1];

	var graphdata = E2.app.player.core.serialise();
	var data = {
		path:	graphname,
		graph:	graphdata
	};

	var openSaveGraph = function(dfd) {
		ga('send', 'event', 'account', 'open', 'publishGraphModal');
		var $modal = VizorUI.modalOpen(publishTemplate(data), 'Publish this scene', 'nopad');
		var $form = $('#publishGraphForm', $modal);
		VizorUI.setupXHRForm($form, function(saved){
			ga('send', 'event', 'graph', 'saved')
			dfd.resolve(saved.path);
		});
	}

	if (!VizorUI.userIsLoggedIn()) {
		VizorUI.openLoginModal()
			.then(openSaveGraph);
	} else {
		openSaveGraph(dfd);
	}

	return dfd.promise
}

/***** EVENT HANDLERS *****/

VizorUI.prototype.onSearchResultsChange = function() {
  var presetsLib = E2.dom.presetsLib;
  var resultsCount = $('.result.table tbody').children().length;
	var presetsList = presetsLib.find('.preset-list-container');
	var maxHeight = presetsList.css('maxHeight');
	if (resultsCount>0) {
		presetsLib.removeClass('collapsed');
		presetsList.show();
		var resultsHeight = $('.result.table').outerHeight(true);
		var newHeight = resultsHeight;
		newHeight = ( newHeight >= maxHeight ) ? (maxHeight) : (newHeight);
		presetsLib.height('auto');
		presetsList.height(newHeight);
	}
	 else {
		presetsLib.height('auto');
		presetsList.height(maxHeight);
	}
};


VizorUI.prototype.onBtnHideAllClicked = function(e) {
	e.preventDefault();
	this.toggleUILayer();
	return false;
}

VizorUI.prototype.onBtnChatClicked = function(e) {
	this.state.visibility.panel_chat = !this.state.visibility.panel_chat;
	return false;
}

VizorUI.prototype.onBtnPresetsClicked = function() {
	this.state.visibility.panel_presets = !this.state.visibility.panel_presets;
	return false;
}

VizorUI.prototype.onBtnAssetsClicked = function() {
	this.state.visibility.panel_assets = !this.state.visibility.panel_assets;
	return false;
}


/***** TOGGLE LAYERS OF THE UI ON OR OFF *****/
VizorUI.prototype.toggleFloatingPanels = function(forceVisibility) {
	var v = this.state.visibility;
	if (typeof forceVisibility !== 'undefined')
		v.floating_panels = forceVisibility;
	else
		v.floating_panels = !v.floating_panels;
};

VizorUI.prototype.togglePatchEditor = function(forceVisibility) {
	var v = this.state.visibility;
	if (typeof forceVisibility !== 'undefined')
		v.patch_editor = forceVisibility;
	else
		v.patch_editor = !v.patch_editor;
}

VizorUI.prototype.toggleUILayer = function() {
	this.state.visible = !this.state.visible;
}

VizorUI.prototype.enterEditorView = function() {
	if ((this.state.viewCamera === uiViewCam.world_editor) && E2.app.worldEditor.isActive()) return false;
	E2.app.toggleWorldEditor(true);
	return false;
}
VizorUI.prototype.enterVRView = function() {
	if ((this.state.viewCamera === uiViewCam.vr) && !E2.app.worldEditor.isActive()) return false;
	E2.app.toggleWorldEditor(false);
	return false;
}

VizorUI.prototype.onChatResize = function() {
	var dom = this.dom;
	var $chatPanel = dom.chatWindow;

	var panelHeight = $chatPanel.outerHeight(true);
	if (panelHeight < 180) {
		panelHeight = 180;
		$chatPanel.height(panelHeight);
	}
	var chatParentHeight = $chatPanel.parent().height();
	if (panelHeight > chatParentHeight) {
		$chatPanel.height(chatParentHeight - 10);
	}

	panelHeight = $chatPanel.outerHeight(true);
	var dragHandleHeight = $chatPanel.find('.drag-handle').height();
	var tabsHeight = dom.chatTabs.height();

	$chatPanel.find('.tab-content .tab-pane').height(panelHeight - dragHandleHeight - tabsHeight)
};


VizorUI.prototype.closePanelChat = function() {
	this.state.visibility.panel_chat = false;
	return false;
}

VizorUI.prototype.closePanelAssets = function() {
	this.state.visibility.panel_assets = false;
	return false;
}

VizorUI.prototype.closePanelPresets = function() {
	this.state.visibility.panel_presets = false;
	return false;
}

VizorUI.prototype.onTreeClicked = function(e) {	// currently unused
	var s = this.state.panelStates.presets || {};
	s.selectedTab = '#graph';
	this.state.panelStates.presets = s;
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}
	return false;
}

VizorUI.prototype.onLibSearchClicked = function(e) {
	var $input = jQuery(e.target);
	var currentLib = $input.parents('.vp-library');
	if (currentLib.hasClass('collapsed')) {
		currentLib.removeClass('collapsed')
		this.onSearchResultsChange();
	}
	return false;
}

VizorUI.prototype.isPanelChatVisible = function() {
	var s = this.state, v = s.visibility;
	return s.visible && v.floating_panels && v.panel_chat;
}
VizorUI.prototype.isPanelPresetsVisible = function() {
	var s = this.state, v = s.visibility;
	return s.visible && v.floating_panels && v.panel_presets;
}
VizorUI.prototype.isPanelAssetsVisible = function() {
	var s = this.state, v = s.visibility;
	return s.visible && v.floating_panels && v.panel_assets;
}

VizorUI.prototype.togglePanelChatCollapsed = function() {
	this.dom.chatToggleButton.trigger('click');
}
VizorUI.prototype.togglePanelAssetsCollapsed = function() {
	this.dom.chatToggleButton.trigger('click');
}
VizorUI.prototype.togglePanelPresetsCollapsed = function() {
	this.dom.chatToggleButton.trigger('click');
}

VizorUI.prototype.onInspectorClicked = function() {
	var app = E2.app;
	if (app.selectedNodes.length===1) {
		if (app.selectedNodes[0].ui.hasPreferences()) {
			app.selectedNodes[0].ui.openInspector();
		} else {
			app.growl('This node has no settings.','info',4000);
		}
	} else {
		app.growl('Select one particular patch to see its settings.','info',4000);
	}
	this.state.visibility.inspector = true;
	return true;
}


VizorUI.prototype.openPresetSaveDialog = function(serializedGraph) {

	var that = this;	// e2.app
	var ui = E2.ui;

	var presetDialog = function() {

		var username = E2.models.user.get('username');
		var presetsPath = '/'+username+'/presets/'

		ui.updateProgressBar(65);

		$.get(presetsPath, function(files) {
			var fsc = new FileSelectControl()
			.frame('save-frame')
			.template('preset')
			.buttons({
				'Cancel': function() {
					ui.updateProgressBar(100);
				},
				'Save': function(name) {
					if (!name)
					{
						bootbox.alert('Please enter a name for the preset');
						return false;
					}

					serializedGraph = serializedGraph || that.player.core.serialise()

					$.ajax({
						type: 'POST',
						url: presetsPath,
						data: {
							name: name,
							graph: serializedGraph
						},
						dataType: 'json',
						success: function() {
							ui.updateProgressBar(100);
							mixpanel.track('Preset Saved')
							that.presetManager.refresh()
						},
						error: function(x, t, err) {
							ui.updateProgressBar(100);

							// since we ask first thing above
							// if (x.status === 401)
							//	return E2.controllers.account.openLoginModal();

							if (x.responseText)
								bootbox.alert('Save failed: ' + x.responseText);
							else
								bootbox.alert('Save failed: ' + err);
						}
					});
				}
			})
			.files(files)
			.on('closed', function(){
				ui.updateProgressBar(100);
			})
			.modal();

			return fsc;
		})
	};

	if (!VizorUI.userIsLoggedIn()) {
		return VizorUI.openLoginModal().then(presetDialog);
	}

	return presetDialog();
};

VizorUI.prototype.setModeBuild = function() {
	this.state.mode = uiMode.build
	setTimeout(function(){
		this.dom.tabObjects.find('a').trigger('click');
	}.bind(this), 100);

	return true;
};
VizorUI.prototype.setModeProgram = function() {
	this.state.mode = uiMode.program
	setTimeout(function(){
		this.dom.tabPresets.find('a').trigger('click');
	}.bind(this), 100);
	return true;
};

VizorUI.prototype.buildBreadcrumb = function(graph, beforeRender) {
	var b = new UIbreadcrumb()
	function buildBreadcrumb(parentEl, graph, add_handler) {
		if (add_handler) {
			b.prepend(graph.tree_node.title, null, function() { graph.tree_node.activate() })
		} else {
			b.prepend(graph.tree_node.title, null)
		}
		if (graph.parent_graph)
			buildBreadcrumb(parentEl, graph.parent_graph, true)
	}
	buildBreadcrumb(this.dom.breadcrumb, graph, false)

	if (typeof beforeRender === 'function') beforeRender(b);
	b.render(this.dom.breadcrumb)
	return b;
}

VizorUI.prototype.toggleFullscreenVRViewButtons = function() {
	var vr = false; // place E2 VR device check here;
	E2.dom.fscreen.parent.toggle(!vr);
	E2.dom.vrview.parent.toggle(vr);
}


/***** MISC UI MODALS/DIALOGS *****/

VizorUI.prototype.viewSource = function() {
	var b = bootbox.dialog({
		message: '<h3 style="margin-top:0;padding-top:0;">source</h3><textarea spellcheck="false" style="resize:none" autocorrect="false" readonly="true" class="form-control scrollbar" cols="80" rows="40">'+
			E2.core.serialise()+'</textarea>',
		buttons: { 'OK': function() {} }
	});
	jQuery(b).addClass('wideauto').addClass('viewsource');
};

VizorUI.prototype.showStartDialog = function() {
	var dfd = when.defer()
	var selectedTemplateUrl = null

	Cookies.set('vizor100', { seen: 1 }, { expires: Number.MAX_SAFE_INTEGER })

	var welcomeModal = VizorUI.modalOpen(
		E2.views.patch_editor.intro({user:E2.models.user.toJSON()}),
		null,
		'nopad welcome editorIntro'
	)

	welcomeModal.on('hidden.bs.modal', function(){
		VizorUI.checkCompatibleBrowser()
		dfd.resolve(selectedTemplateUrl)
	})

	var $slides = jQuery('.minislides', welcomeModal)
	var ms = new Minislides($slides);

	jQuery('a.modal-close', $slides).on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		VizorUI.modalClose(welcomeModal);
		return false;
	});

	jQuery('a.view-create360', $slides).on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		VizorUI.modalClose(welcomeModal);
		selectedTemplateUrl = '/data/graphs/create-360.json'
		return false;
	});

	jQuery('a.view-example', $slides).on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		VizorUI.modalClose(welcomeModal);
		selectedTemplateUrl = '/data/graphs/example.json'
		return false;
	});

	jQuery('a.sign-in', $slides).on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		E2.controllers.account.openLoginModal()
		return false;
	});

	jQuery('a.sign-up', $slides).on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		E2.controllers.account.openSignupModal()
		return false;
	});

	return dfd.promise;
}

VizorUI.prototype.updateProgressBar = function(percent) {
	var dom = this.dom;
	percent = 0.0 + percent;
	if (percent > 100) percent = 100;
	if (percent < 0) percent = 0;
	dom.progressBar = $('#progressbar');
	
	if (!dom.progressBar.is(':visible'))
		dom.progressBar.show().width(1);
	
	var winWidth = $(window).width();
	var barWidth = dom.progressBar.width();
	var newWidth = winWidth / 100 * percent;
	var barSpace = winWidth - barWidth;
	var barSpeed = 1000 - percent * 8;
	
	percent = (percent === 0) ? (barWidth / newWidth + 5) : (percent);
	newWidth = (newWidth <= barWidth) ? (barSpace / 100 * percent + barWidth) : (newWidth);
	
	dom.progressBar.stop().animate({width: newWidth}, {duration: barSpeed, easing: 'linear', complete: function() {
		if ($(this).width() === winWidth)
			$(this).fadeOut('slow');
	}});
}


/***** HELPER METHODS *****/




VizorUI.checkCompatibleBrowser = function() {
	var agent = navigator.userAgent;
	var heading=false, message=false;

	var isMobile = VizorUI.isMobile.any();


	if ((/Chrome/i.test(agent)) || (/Firefox/i.test(agent))) {

	}
	else if (isMobile) {
		heading = 'Mobile support';
		message = '<h4>Please view this page on your desktop/laptop. '+
					 'The editor is not ready for mobile just yet.</h4>';
	}
	else {
		heading = 'Browser support';
		message = '<h4>We want you to fully enjoy Vizor. <br />The editor works best in '+
					 '<a href="http://www.google.com/chrome/" target="_blank"'+
					 ' alt="Get Chrome">Chrome</a> or '+
					 '<a href="http://www.mozilla.org/firefox/new/" target="_blank"'+
					 ' alt="Get Firefox">Firefox</a>.</h4>';

	}
	if (message) VizorUI.modalOpen(message, heading, 'note', true, {buttons: { Ok: function() {}}});
}
