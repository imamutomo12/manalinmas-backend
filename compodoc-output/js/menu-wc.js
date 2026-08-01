'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">manalinmas-backend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search">
    <input type="text" placeholder="Type to search">
    <button type="button"
        class="search-input-clear"
        aria-label="Clear search"
        data-search-input-clear>&times;</button>
</div>
` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="architecture.html" data-type="chapter-link">
                                        <span class="icon ion-ios-git-branch"></span>Architecture
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' : 'data-bs-target="#xs-controllers-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' :
                                            'id="xs-controllers-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' : 'data-bs-target="#xs-injectables-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' :
                                        'id="xs-injectables-links-module-AppModule-698b8fd4e03cd114249750383c21bd57c06a5b613945eb32076a113dc8405d05efcab6d5b9d8487179df1837063a8d7f9d16ee4649409517bafe9606bae83855"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AttendanceModule.html" data-type="entity-link" >AttendanceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' : 'data-bs-target="#xs-controllers-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' :
                                            'id="xs-controllers-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' }>
                                            <li class="link">
                                                <a href="controllers/AttendanceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AttendanceController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/GeofenceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GeofenceController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' : 'data-bs-target="#xs-injectables-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' :
                                        'id="xs-injectables-links-module-AttendanceModule-382bf360d631c3825ce49fc6a36330700f1b55bfb1abd08ff5f883bb933f86ccd3a6d68c6cda8d0bc8414ea43afcffa2d0eb552063f46f1df24eace3952d6468"' }>
                                        <li class="link">
                                            <a href="injectables/AttendanceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AttendanceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' :
                                            'id="xs-controllers-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' :
                                        'id="xs-injectables-links-module-AuthModule-50e870a85332f2f772810dac1f642f4cab705af356eedda753741a899245b0f391b243d85e81047ee293c67e6fd122e8e8ae8542aff27c1cc043306a9b449ed7"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtAuthGuard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtAuthGuard</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CommonModule.html" data-type="entity-link" >CommonModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CommonModule-7a4bba0df15bf3124975197596d1fd02f6324d1e720ccb45701bb6845ec3d4c8ae8abe0d978f879599e987ec7cfead59353692fdc83cba7773bd30eef0edbd26"' : 'data-bs-target="#xs-injectables-links-module-CommonModule-7a4bba0df15bf3124975197596d1fd02f6324d1e720ccb45701bb6845ec3d4c8ae8abe0d978f879599e987ec7cfead59353692fdc83cba7773bd30eef0edbd26"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CommonModule-7a4bba0df15bf3124975197596d1fd02f6324d1e720ccb45701bb6845ec3d4c8ae8abe0d978f879599e987ec7cfead59353692fdc83cba7773bd30eef0edbd26"' :
                                        'id="xs-injectables-links-module-CommonModule-7a4bba0df15bf3124975197596d1fd02f6324d1e720ccb45701bb6845ec3d4c8ae8abe0d978f879599e987ec7cfead59353692fdc83cba7773bd30eef0edbd26"' }>
                                        <li class="link">
                                            <a href="injectables/TransformInterceptor.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TransformInterceptor</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/HomeModule.html" data-type="entity-link" >HomeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' : 'data-bs-target="#xs-controllers-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' :
                                            'id="xs-controllers-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' }>
                                            <li class="link">
                                                <a href="controllers/HomeController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomeController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' : 'data-bs-target="#xs-injectables-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' :
                                        'id="xs-injectables-links-module-HomeModule-092bb7615269f84c856f16a352db4f85de4c11afd8b7296d9db45ac4974a0c5cbf307a6a0f870ae7b2bf4b4256ebee85b0701fd442774069efbc5961dd825aac"' }>
                                        <li class="link">
                                            <a href="injectables/HomeService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomeService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/IncidentsModule.html" data-type="entity-link" >IncidentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' : 'data-bs-target="#xs-controllers-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' :
                                            'id="xs-controllers-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' }>
                                            <li class="link">
                                                <a href="controllers/IncidentsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IncidentsController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/MyIncidentsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MyIncidentsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' : 'data-bs-target="#xs-injectables-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' :
                                        'id="xs-injectables-links-module-IncidentsModule-8272aab87d835f36450949aa98487f2bbe3daa14b9568b7c243e4cc84fdaedb224e504006dc4bc9fded091d3691c016248a8e3bae630269dadfe85be1c4ffc7f"' }>
                                        <li class="link">
                                            <a href="injectables/IncidentsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IncidentsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/NotificationsModule.html" data-type="entity-link" >NotificationsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NotificationsModule-3c9b303964f736cfa88b77dd7d9b66959869bda005fb2328227a0375fd9ceedccad24a94940ba97d3c77b24f33df1cfeab0088042a2317526ee630c9370d4bb4"' : 'data-bs-target="#xs-injectables-links-module-NotificationsModule-3c9b303964f736cfa88b77dd7d9b66959869bda005fb2328227a0375fd9ceedccad24a94940ba97d3c77b24f33df1cfeab0088042a2317526ee630c9370d4bb4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NotificationsModule-3c9b303964f736cfa88b77dd7d9b66959869bda005fb2328227a0375fd9ceedccad24a94940ba97d3c77b24f33df1cfeab0088042a2317526ee630c9370d4bb4"' :
                                        'id="xs-injectables-links-module-NotificationsModule-3c9b303964f736cfa88b77dd7d9b66959869bda005fb2328227a0375fd9ceedccad24a94940ba97d3c77b24f33df1cfeab0088042a2317526ee630c9370d4bb4"' }>
                                        <li class="link">
                                            <a href="injectables/NotificationsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PatrolsModule.html" data-type="entity-link" >PatrolsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' : 'data-bs-target="#xs-controllers-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' :
                                            'id="xs-controllers-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' }>
                                            <li class="link">
                                                <a href="controllers/PatrolsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PatrolsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' : 'data-bs-target="#xs-injectables-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' :
                                        'id="xs-injectables-links-module-PatrolsModule-2b89e3e4ec24ede62187fe83b320a155bb13ef781314e05c788338f3ded396b6987453309977a6c68389fdcfad8090abaaf0a9f30184e365579776cd5f458212"' }>
                                        <li class="link">
                                            <a href="injectables/PatrolsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PatrolsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PrismaModule.html" data-type="entity-link" >PrismaModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' : 'data-bs-target="#xs-injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' :
                                        'id="xs-injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' }>
                                        <li class="link">
                                            <a href="injectables/PrismaService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PrismaService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileModule.html" data-type="entity-link" >ProfileModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' : 'data-bs-target="#xs-controllers-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' :
                                            'id="xs-controllers-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' }>
                                            <li class="link">
                                                <a href="controllers/ProfileController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' : 'data-bs-target="#xs-injectables-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' :
                                        'id="xs-injectables-links-module-ProfileModule-fd3c3193ecedc0f393353f5d21a46af8d451cbeb23e4313f8f1a3cade814518878bf4f120c77c0d54e9090e2d3d708c3a953328b44890b85b082d9548bf2eb9f"' }>
                                        <li class="link">
                                            <a href="injectables/ProfileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReguModule.html" data-type="entity-link" >ReguModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' : 'data-bs-target="#xs-controllers-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' :
                                            'id="xs-controllers-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' }>
                                            <li class="link">
                                                <a href="controllers/ReguController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReguController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' : 'data-bs-target="#xs-injectables-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' :
                                        'id="xs-injectables-links-module-ReguModule-4a18b410dedd7f9ac48eae3d91e600dc9c72d78a0928a2958b4af28d9a7bd3cc32642b7a91d1671df0acada85e0df3da1c08abc57eb8d00082c38fb76808980c"' }>
                                        <li class="link">
                                            <a href="injectables/ReguService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReguService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SalariesModule.html" data-type="entity-link" >SalariesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' : 'data-bs-target="#xs-controllers-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' :
                                            'id="xs-controllers-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' }>
                                            <li class="link">
                                                <a href="controllers/SalariesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SalariesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' : 'data-bs-target="#xs-injectables-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' :
                                        'id="xs-injectables-links-module-SalariesModule-d0ed3200190aa04e1eff216f475485e82528e85befa051b86b3e9b908a3b69c8ee3af07817d9744d97883bbc8700820400ce9ee81cd91a6b2c761690fcdcd9cb"' }>
                                        <li class="link">
                                            <a href="injectables/SalariesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SalariesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SalaryAdjustmentsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SalaryAdjustmentsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ShiftsModule.html" data-type="entity-link" >ShiftsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' : 'data-bs-target="#xs-controllers-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' :
                                            'id="xs-controllers-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' }>
                                            <li class="link">
                                                <a href="controllers/ShiftsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShiftsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' : 'data-bs-target="#xs-injectables-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' :
                                        'id="xs-injectables-links-module-ShiftsModule-8f1b45d40e1dcafa30b7ba73b468d9c4daacf37557e5dcd58606b334b982415b204695549ef3bdf032629c7ca4478a6b6eec261c43a55cd3da0e24813acb079a"' }>
                                        <li class="link">
                                            <a href="injectables/ShiftsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShiftsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StorageModule.html" data-type="entity-link" >StorageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' : 'data-bs-target="#xs-controllers-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' :
                                            'id="xs-controllers-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' }>
                                            <li class="link">
                                                <a href="controllers/StorageController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StorageController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' : 'data-bs-target="#xs-injectables-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' :
                                        'id="xs-injectables-links-module-StorageModule-2b27a2303d772e64b4a11d8231355a676f57f871ee563ea30a4da1afbac4fe565542f586fd0ba3ea8f6179f2c3948a4dea4b862c3bb0803cba1dafd9c0322bdb"' }>
                                        <li class="link">
                                            <a href="injectables/StorageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StorageService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link" >UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' : 'data-bs-target="#xs-controllers-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' :
                                            'id="xs-controllers-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' : 'data-bs-target="#xs-injectables-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' :
                                        'id="xs-injectables-links-module-UsersModule-30f0415f5f6bdfcf559b84b823af632cc606e6941124100fdfb54f32d554845d034b6c11cea71edabac1cde945361682b710fea9d94d45092cbd7f77a78f7d69"' }>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ViolationsModule.html" data-type="entity-link" >ViolationsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' : 'data-bs-target="#xs-controllers-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' :
                                            'id="xs-controllers-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' }>
                                            <li class="link">
                                                <a href="controllers/ViolationsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViolationsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' : 'data-bs-target="#xs-injectables-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' :
                                        'id="xs-injectables-links-module-ViolationsModule-9155e474ec5791be14aa2b7275874fe6cfc73c7d8d8484bf67945ec1ee0b2d708d0562d3dcf693f658bd373aa750fba77326e1048ac8ab51970c0a1d8db4a33b"' }>
                                        <li class="link">
                                            <a href="injectables/ViolationsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViolationsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ApproveSalaryAdjustmentDto.html" data-type="entity-link" >ApproveSalaryAdjustmentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkCreateShiftDto.html" data-type="entity-link" >BulkCreateShiftDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClaimIncidentDto.html" data-type="entity-link" >ClaimIncidentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClientGpsDto.html" data-type="entity-link" >ClientGpsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClientGpsLocationDto.html" data-type="entity-link" >ClientGpsLocationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClockInDto.html" data-type="entity-link" >ClockInDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClockOutDto.html" data-type="entity-link" >ClockOutDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateIncidentDto.html" data-type="entity-link" >CreateIncidentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePatrolDto.html" data-type="entity-link" >CreatePatrolDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateReguDto.html" data-type="entity-link" >CreateReguDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateShiftDto.html" data-type="entity-link" >CreateShiftDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateViolationDto.html" data-type="entity-link" >CreateViolationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetMultipleFilesDto.html" data-type="entity-link" >GetMultipleFilesDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetUsersQueryDto.html" data-type="entity-link" >GetUsersQueryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/HttpExceptionFilter.html" data-type="entity-link" >HttpExceptionFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/InterveneIncidentDto.html" data-type="entity-link" >InterveneIncidentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LogoutDto.html" data-type="entity-link" >LogoutDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RefreshTokenDto.html" data-type="entity-link" >RefreshTokenDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterLinmasDto.html" data-type="entity-link" >RegisterLinmasDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterWargaDto.html" data-type="entity-link" >RegisterWargaDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubstituteShiftDto.html" data-type="entity-link" >SubstituteShiftDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateIncidentStatusDto.html" data-type="entity-link" >UpdateIncidentStatusDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateReguDto.html" data-type="entity-link" >UpdateReguDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateShiftDto.html" data-type="entity-link" >UpdateShiftDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadFileDto.html" data-type="entity-link" >UploadFileDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/LoggerMiddleware.html" data-type="entity-link" >LoggerMiddleware</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/RolesGuard.html" data-type="entity-link" >RolesGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/GlobalResponse.html" data-type="entity-link" >GlobalResponse&lt;T&gt;</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});
