function SpinToWin(config) {
  this.config = config;
  if (window.Android || window.BrowserTest) {
    this.convertConfigJson();
  }
  this.container = document.getElementById("container");
  this.wheelContainer = document.getElementById("wheel-container");
  this.closeButton = document.getElementById("spin-to-win-box-close");
  this.titleElement = document.getElementById("form-title");
  this.messageElement = document.getElementById("form-message");
  this.submitButton = document.getElementById("form-submit-btn");
  this.emailInput = document.getElementById("vl-form-input");
  this.consentContainer = document.getElementById("vl-form-consent");
  this.emailPermitContainer = document.getElementById("vl-permitform-email");
  this.consentCheckbox = document.getElementById("vl-form-checkbox");
  this.emailPermitCheckbox = document.getElementById("vl-form-checkbox-emailpermit");
  this.consentText = document.getElementById("vl-form-consent-text");
  this.emailPermitText = document.getElementById("vl-permitform-email-text");
  this.couponCode = document.getElementById("coupon-code");
  this.copyButton = document.getElementById("form-copy-btn");
  this.warning = document.getElementById("vl-warning");
  this.invalidEmailMessageLi = document.getElementById("invalid-email-message");
  this.checkConsentMessageLi = document.getElementById("check-consent-message");

  this.successMessageElement = document.getElementById("success-message");
  this.promocodeTitleElement = document.getElementById("promocode-title");

  this.formValidation = {
    email: true,
    consent: true
  };
  this.spinCompleted = false;
  this.easyWheelInitialized = false;
  this.config.windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  this.config.statusBarHeight = window.screen.height - window.innerHeight;
  this.config.windowHeightWidthRatio = window.innerHeight / window.innerWidth;

  if (this.config.taTemplate == "full_spin") {
    this.config.wheelContainerMarginLeft = this.config.windowHeightWidthRatio > 1.5 ? window.innerWidth / 6 : window.innerWidth / 4;
    this.config.r = parseFloat(window.innerWidth / 2) - this.config.wheelContainerMarginLeft;
    this.config.wheelContainerWidth = this.config.windowWidth - this.config.wheelContainerMarginLeft * 2;
  } else {
    this.config.wheelContainerMarginLeft = 0;
    this.config.r = parseFloat(window.innerWidth / 2);
    this.config.wheelContainerWidth = this.config.windowWidth;
  }

  this.config.selectedPromotionCode = "";
  this.convertStringsToNumber();
  this.setCloseButton();
  this.config.mailFormEnabled = config.mailSubscription;
  this.setTickAudio();
  this.setContent();
  this.styleHandler();
  window.onresize = function () {
    window.spinToWin.styleHandler();
  }
  window.spinToWin = this;
  this.createItems();
  this.createEasyWheel();
  this.handleVisibility();
}


SpinToWin.prototype.createItems = function () {
  this.config.items = [];
  var i = 0;
  for (; i < this.config.slices.length; i++) {
    this.config.items.push({
      id: i, name: window.spinToWin.breakString(this.config.slices[i].displayName, 10)
      , color: this.config.slices[i].color, code: this.config.slices[i].code
      , type: this.config.slices[i].type, win: false
    });
  }
  if (this.config.sliceCount > this.config.slices.length) {
    while (this.config.items.length < this.config.sliceCount) {
      var sliceId = i % this.config.slices.length;
      this.config.items.push({
        id: i, name: window.spinToWin.breakString(this.config.slices[sliceId].displayName, 10)
        , color: this.config.slices[sliceId].color, code: this.config.slices[sliceId].code
        , type: this.config.slices[sliceId].type, win: false
      });
      i++;
    }
  }
};

SpinToWin.prototype.createEasyWheel = function () {
  $('#wheel-container').easyWheel({
    items: window.spinToWin.config.items, duration: 1, rotates: 4, frame: 6, easing: "easyWheel", type: "spin"
    , width: window.spinToWin.config.wheelContainerWidth, fontSize: window.spinToWin.config.displaynameTextSize + 8
    , textOffset: 8, letterSpacing: 0, textLine: "v", textArc: true, outerLineWidth: 5
    , centerImage: window.spinToWin.config.img, centerWidth: 20, centerLineWidth: 5, centerImageWidth: 20
    , textColor: window.spinToWin.config.displaynameTextColor, markerColor: window.spinToWin.config.buttonColor
    , centerLineColor: "#ffffff", centerBackground: "#ffffff", sliceLineColor: "#ffffff", outerLineColor: "#ffffff",
    onStep: function (item, slicePercent, circlePercent) {
      if (window.spinToWin.easyWheelInitialized) {
        if (typeof window.spinToWin.config.tickAudio.currentTime !== 'undefined') {
          window.spinToWin.config.tickAudio.currentTime = 0;
        }
        window.spinToWin.config.tickAudio.play();
      }
    },
    onStart: function (results, spinCount, now) {
    },
    onComplete: function (results, count, now) {
      if (!window.spinToWin.easyWheelInitialized) {
        window.spinToWin.easyWheelInitialized = true;
        window.easyWheel.items[0].win = false;
        window.easyWheel.o.duration = 6000;
      } else {
        window.spinToWin.resultHandler(results);
      }
    }
  });
  window.easyWheel.items[0].win = true;
  window.easyWheel.start();
};

SpinToWin.prototype.convertConfigJson = function () {
  //actiondata
  this.config.mailSubscription = this.config.actiondata.mail_subscription;
  this.config.sliceCount = this.config.actiondata.slice_count;
  this.config.slices = this.config.actiondata.slices;
  this.config.img = this.config.actiondata.img;
  this.config.taTemplate = this.config.actiondata.taTemplate;

  //spin_to_win_content
  this.config.title = this.config.actiondata.spin_to_win_content.title;
  this.config.message = this.config.actiondata.spin_to_win_content.message;
  this.config.placeholder = this.config.actiondata.spin_to_win_content.placeholder;
  this.config.buttonLabel = this.config.actiondata.spin_to_win_content.button_label;
  this.config.consentText = this.config.actiondata.spin_to_win_content.consent_text;
  this.config.emailPermitText = this.config.actiondata.spin_to_win_content.emailpermit_text;
  this.config.successMessage = this.config.actiondata.spin_to_win_content.success_message;
  this.config.invalidEmailMessage = this.config.actiondata.spin_to_win_content.invalid_email_message;
  this.config.checkConsentMessage = this.config.actiondata.spin_to_win_content.check_consent_message;
  this.config.promocodeTitle = this.config.actiondata.spin_to_win_content.promocode_title;
  this.config.copyButtonLabel = this.config.actiondata.spin_to_win_content.copybutton_label;


  var extendedProps = JSON.parse(decodeURIComponent(this.config.actiondata.ExtendedProps));
  this.config.displaynameTextColor = extendedProps.displayname_text_color;
  this.config.displaynameFontFamily = extendedProps.displayname_font_family;
  this.config.displaynameTextSize = extendedProps.displayname_text_size;
  this.config.titleTextColor = extendedProps.title_text_color;
  this.config.titleFontFamily = extendedProps.title_font_family;
  this.config.titleTextSize = extendedProps.title_text_size;
  this.config.textColor = extendedProps.text_color;
  this.config.textFontFamily = extendedProps.text_font_family;
  this.config.textSize = extendedProps.text_size;
  this.config.buttonColor = extendedProps.button_color;
  this.config.buttonTextColor = extendedProps.button_text_color;
  this.config.buttonFontFamily = extendedProps.button_font_family;
  this.config.buttonTextSize = extendedProps.button_text_size;
  this.config.promocodeTitleTextColor = extendedProps.promocode_title_text_color;
  this.config.promocodeTitleFontFamily = extendedProps.promocode_title_font_family;
  this.config.promocodeTitleTextSize = extendedProps.promocode_title_text_size;
  this.config.promocodeBackgroundColor = extendedProps.promocode_background_color;
  this.config.promocodeTextColor = extendedProps.promocode_text_color;
  this.config.copybuttonColor = extendedProps.copybutton_color;
  this.config.copybuttonTextColor = extendedProps.copybutton_text_color;
  this.config.copybuttonFontFamily = extendedProps.copybutton_font_family;
  this.config.copybuttonTextSize = extendedProps.copybutton_text_size;
  this.config.emailpermitTextSize = extendedProps.emailpermit_text_size;
  this.config.emailpermitTextUrl = extendedProps.emailpermit_text_url;
  this.config.consentTextSize = extendedProps.consent_text_size;
  this.config.consentTextUrl = extendedProps.consent_text_url;
  this.config.closeButtonColor = extendedProps.close_button_color;
  this.config.backgroundColor = extendedProps.background_color;
}

SpinToWin.prototype.getPromotionCode = function () {
  if (window.Android) {
    Android.getPromotionCode();
  } else if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.eventHandler.postMessage({
      method: "getPromotionCode"
    });
  } else {
    window.BrowserTest.getPromotionCode();
  }
};

SpinToWin.prototype.subscribeEmail = function () {
  if (window.Android) {
    Android.subscribeEmail(this.emailInput.value.trim());
  } else if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.eventHandler.postMessage({
      method: "subscribeEmail",
      email: this.emailInput.value.trim()
    });
  }
};

SpinToWin.prototype.close = function () {
  if (window.Android) {
    Android.close();
  } else if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.eventHandler.postMessage({
      method: "close"
    });
  }
};

SpinToWin.prototype.copyToClipboard = function () {
  if (window.Android) {
    Android.copyToClipboard(this.couponCode.innerText);
  } else if (window.webkit.messageHandlers.eventHandler) {
    window.webkit.messageHandlers.eventHandler.postMessage({
      method: "copyToClipboard",
      couponCode: this.couponCode.innerText
    });
  }
};

SpinToWin.prototype.sendReport = function () {
  if (window.Android) {
    Android.sendReport();
  } else if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.eventHandler.postMessage({
      method: "sendReport"
    });
  }
};

SpinToWin.prototype.openUrl = function (url) {
  if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.eventHandler.postMessage({
      method: "openUrl",
      url: url
    });
  }
};

SpinToWin.prototype.convertStringsToNumber = function () {
  this.config.displaynameTextSize = isNaN(parseInt(this.config.displaynameTextSize)) ? 10 : parseInt(this.config.displaynameTextSize);
  this.config.titleTextSize = isNaN(parseInt(this.config.titleTextSize)) ? 10 : parseInt(this.config.titleTextSize);
  this.config.textSize = isNaN(parseInt(this.config.textSize)) ? 5 : parseInt(this.config.textSize);
  this.config.buttonTextSize = isNaN(parseInt(this.config.buttonTextSize)) ? 20 : parseInt(this.config.buttonTextSize);
  this.config.consentTextSize = isNaN(parseInt(this.config.consentTextSize)) ? 5 : parseInt(this.config.consentTextSize);
  this.config.copybuttonTextSize = isNaN(parseInt(this.config.copybuttonTextSize)) ? 20 : parseInt(this.config.copybuttonTextSize);
  this.config.promocodeTitleTextSize = isNaN(parseInt(this.config.promocodeTitleTextSize)) ? 20 : parseInt(this.config.promocodeTitleTextSize);
};

SpinToWin.prototype.setContent = function () {
  this.container.style.backgroundColor = this.config.backgroundColor;
  this.titleElement.innerHTML = this.config.title.replace(/\\n/g, '<br/>');
  this.titleElement.style.color = this.config.titleTextColor;
  this.titleElement.style.fontFamily = this.config.titleFontFamily;
  this.titleElement.style.fontSize = (this.config.titleTextSize + 20) + "px";
  this.messageElement.innerHTML = this.config.message.replace(/\\n/g, '<br/>');
  this.messageElement.style.color = this.config.textColor;
  this.messageElement.style.fontFamily = this.config.textFontFamily;
  this.messageElement.style.fontSize = (this.config.textSize + 10) + "px";
  this.submitButton.innerHTML = this.config.buttonLabel;
  this.submitButton.style.color = this.config.buttonTextColor;
  this.submitButton.style.backgroundColor = this.config.buttonColor;
  this.submitButton.style.fontFamily = this.config.buttonFontFamily;
  this.submitButton.style.fontSize = (this.config.buttonTextSize + 20) + "px";
  this.emailInput.placeholder = this.config.placeholder;
  this.consentText.innerHTML = this.prepareCheckboxHtmls(this.config.consentText, this.config.consentTextUrl);
  this.consentText.style.fontSize = (this.config.consentTextSize + 10) + "px";
  this.consentText.style.fontFamily = this.config.textFontFamily;
  this.emailPermitText.innerHTML = this.prepareCheckboxHtmls(this.config.emailPermitText, this.config.emailpermitTextUrl);
  this.emailPermitText.style.fontSize = (this.config.consentTextSize + 10) + "px";
  this.emailPermitText.style.fontFamily = this.config.textFontFamily;
  this.copyButton.innerHTML = this.config.copyButtonLabel;
  this.copyButton.style.color = this.config.copybuttonTextColor;
  this.copyButton.style.backgroundColor = this.config.copybuttonColor;
  this.copyButton.style.fontFamily = this.config.copybuttonFontFamily;
  this.copyButton.style.fontSize = (this.config.copybuttonTextSize + 20) + "px";
  this.invalidEmailMessageLi.innerHTML = this.config.invalidEmailMessage;
  this.invalidEmailMessageLi.style.fontSize = (this.config.consentTextSize + 10) + "px";
  this.invalidEmailMessageLi.style.fontFamily = this.config.textFontFamily;
  this.checkConsentMessageLi.innerHTML = this.config.checkConsentMessage;
  this.checkConsentMessageLi.style.fontSize = (this.config.consentTextSize + 10) + "px";
  this.checkConsentMessageLi.style.fontFamily = this.config.textFontFamily;

  this.couponCode.style.color = this.config.promocodeTextColor;
  this.couponCode.style.backgroundColor = this.config.promocodeBackgroundColor;
  this.couponCode.style.fontFamily = this.config.copybuttonFontFamily;
  this.couponCode.style.fontSize = (this.config.copybuttonTextSize + 20) + "px";

  this.successMessageElement.innerHTML = this.config.successMessage;
  this.successMessageElement.style.color = "green";

  this.promocodeTitleElement.innerHTML = this.config.promocodeTitle.replace(/\\n/g, '<br/>');
  this.promocodeTitleElement.style.color = this.config.promocodeTitleTextColor;
  this.promocodeTitleElement.style.fontFamily = this.config.promocodeTitleFontFamily;
  this.promocodeTitleElement.style.fontSize = (this.config.promocodeTitleTextSize + 20) + "px";

  this.container.addEventListener("click", function (event) {
    if (event.target.tagName != "INPUT") {
      document.activeElement.blur();
    }
  });

  this.submitButton.addEventListener("click", this.submit);
  this.closeButton.addEventListener("click", evt => this.close());
  this.copyButton.addEventListener("click", evt => this.copyToClipboard());
};

SpinToWin.prototype.validateForm = function () {
  var result = {
    email: true,
    consent: true
  };
  if (!this.validateEmail(this.emailInput.value)) {
    result.email = false;
  }
  if (!this.isNullOrWhitespace(this.consentText.innerText)) {
    result.consent = this.consentCheckbox.checked;
  }
  if (result.consent) {
    if (!this.isNullOrWhitespace(this.emailPermitText.innerText)) {
      result.consent = this.emailPermitCheckbox.checked;
    }
  }
  this.formValidation = result;
  return result;
};

SpinToWin.prototype.handleVisibility = function () {

  if (this.spinCompleted) {
    this.couponCode.style.display = "";
    this.copyButton.style.display = "";
    this.emailInput.style.display = "none";
    this.submitButton.style.display = "none";
    this.consentContainer.style.display = "none";
    this.emailPermitContainer.style.display = "none";
    this.warning.style.display = "none";
    this.successMessageElement.style.display = "";
    this.promocodeTitleElement.style.display = "";
    return;
  } else {
    this.couponCode.style.display = "none";
    this.copyButton.style.display = "none";
    this.successMessageElement.style.display = "none";
    this.promocodeTitleElement.style.display = "none";
  }

  this.warning.style.display = "none";

  if (this.config.mailFormEnabled) {
    if (!this.formValidation.email || !this.formValidation.consent) {
      this.warning.style.display = "";
      if (this.formValidation.email) {
        this.invalidEmailMessageLi.style.display = "none";
      } else {
        this.invalidEmailMessageLi.style.display = "";
      }
      if (this.formValidation.consent) {
        this.checkConsentMessageLi.style.display = "none";
      } else {
        this.checkConsentMessageLi.style.display = "";
      }
    } else {
      this.warning.style.display = "none";
    }

    if (this.isNullOrWhitespace(this.consentText.innerHTML)) {
      this.consentCheckbox.style.display = "none";
      this.consentContainer.style.display = "none";
    }

    if (this.isNullOrWhitespace(this.emailPermitText.innerHTML)) {
      this.emailPermitCheckbox.style.display = "none";
      this.emailPermitContainer.style.display = "none";
    }

  } else {
    this.emailInput.style.display = "none";
    this.consentContainer.style.display = "none";
    this.emailPermitContainer.style.display = "none";
  }
};

SpinToWin.prototype.styleHandler = function () {

  this.wheelContainer.style.position = "absolute";
  this.wheelContainer.style.fontFamily = this.config.displaynameFontFamily;

  if (this.config.taTemplate == "full_spin") {
    this.wheelContainer.style.marginLeft = this.config.wheelContainerMarginLeft + "px";
    this.wheelContainer.style.bottom = window.innerHeight > 600 ? (this.config.statusBarHeight + this.config.wheelContainerMarginLeft) + "px" : "10px";
  } else {
    this.wheelContainer.style.marginLeft = this.config.wheelContainerMarginLeft + "px";
    this.wheelContainer.style.bottom = ((- (this.config.r * 2) / 2) + this.config.statusBarHeight) + "px";
  }

  var styleEl = document.createElement("style"),
    styleString = "#wheel-container{float:left;width:" + config.r + "px;height:" + (2 * this.config.r) + "px}" +
      "#form-title, #form-message, #success-message, #promocode-title{text-align:center;}" +
      "#warning{display:none; position: absolute; z-index: 3; background: #fcf6c1; font-size: 12px; border: 1px solid #ccc; top: 105%;width: 100%; box-sizing: border-box;}" +
      "#warning>ul{margin: 2px;padding-inline-start: 20px;}" +
      ".form-submit-btn{transition:.2s filter ease-in-out;}" +
      ".form-submit-btn:hover{filter: brightness(110%);transition:.2s filter ease-in-out;}" +
      ".form-submit-btn.disabled{filter: grayscale(100%);transition:.2s filter ease-in-out;}" +
      "@media only screen and (max-width:2500px){" +
      "#wheel-container{float:unset;width:100%;text-align:center;position:relative}" +
      "}";

  styleEl.id = "vl-styles";
  if (!document.getElementById("vl-styles")) {
    styleEl.innerHTML = styleString;
    document.head.appendChild(styleEl);
  } else {
    document.getElementById("vl-styles").innerHTML = styleString;
  }
};

SpinToWin.prototype.submit = function () {
  if (config.mailFormEnabled) {
    this.formValidation = window.spinToWin.validateForm();
    if (!window.spinToWin.formValidation.email || !window.spinToWin.formValidation.consent) {
      window.spinToWin.handleVisibility();
      return;
    }
    window.spinToWin.subscribeEmail();
  }
  window.spinToWin.sendReport();
  window.spinToWin.handleVisibility();
  window.spinToWin.submitButton.removeEventListener("click", window.spinToWin.submit);
  window.spinToWin.getPromotionCode();
};

SpinToWin.prototype.spin = function (sliceIndex, promotionCode) {
  if (sliceIndex > -1) {
    window.spinToWin.config.items[sliceIndex].win = true;
    window.spinToWin.config.items[sliceIndex].code = promotionCode;
  } else {
    var staticCodeSliceIndexes = [];
    for (var i = 0; i < window.spinToWin.config.items.length; i++) {
      if (window.spinToWin.config.items.type = 'staticcode') {
        staticCodeSliceIndexes.push(i);
      }
    }
    if (staticCodeSliceIndexes.length > 0) {
      sliceIndex = staticCodeSliceIndexes[this.randomInt(0, staticCodeSliceIndexes.length)];
    } else {
      var passSliceIndexes = [];
      for (var i = 0; i < window.spinToWin.config.items.length; i++) {
        if (window.spinToWin.config.items.type = 'pass') {
          passSliceIndexes.push(i);
        }
      }
      sliceIndex = passSliceIndexes[this.randomInt(0, passSliceIndexes.length)];
    }
  }
  window.spinToWin.spinHandler(sliceIndex);
};

SpinToWin.prototype.spinHandler = function (result) {
  var vl_form_input = document.getElementById("vl-form-input");
  if (vl_form_input !== null)
    vl_form_input.setAttribute("disabled", "");
  var vl_form_checkbox = document.getElementById("vl-form-checkbox");
  if (vl_form_checkbox !== null)
    vl_form_checkbox.setAttribute("disabled", "");
  var vl_form_checkbox_emailpermit = document.getElementById("vl-form-checkbox-emailpermit");
  if (vl_form_checkbox_emailpermit !== null)
    vl_form_checkbox_emailpermit.setAttribute("disabled", "");
  var vl_form_submit_btn = document.getElementsByClassName("form-submit-btn");
  if (vl_form_submit_btn !== null)
    vl_form_submit_btn[0].classList.add("disabled");

  window.spinToWin.config.items[result].win = true;
  window.easyWheel.items[result].win = true;
  window.easyWheel.start();
};

SpinToWin.prototype.resultHandler = function (res) {
  this.spinCompleted = true;
  this.couponCode.innerText = res.code;
  this.couponCode.value = res.code;
  this.handleVisibility();
};

//Helper functions

SpinToWin.prototype.breakString = function (str, limit) {
  let brokenString = '';
  for (let i = 0, count = 0; i < str.length; i++) {
    if (count >= limit && str[i] === ' ') {
      count = 0;
      brokenString += '<br>';
    } else {
      count++;
      brokenString += str[i];
    }
  }
  return brokenString;
};

SpinToWin.prototype.prepareCheckboxHtmls = function (text, url) {
  if (this.isNullOrWhitespace(text)) {
    return "";
  }
  else if (this.isNullOrWhitespace(url)) {
    return text.replaceAll('<LINK>', '').replaceAll('</LINK>', '');
  }
  else if (!text.includes("<LINK>")) {
    if (window.webkit && window.webkit.messageHandlers.eventHandler) {
      return '<a href="javascript:window.spinToWin.openUrl(\'' + url + '\')">' + text + '</a>';
    } else {
      return '<a href="' + url + '">' + text + '</a>';
    }
  } else {
    var linkRegex = /<LINK>(.*?)<\/LINK>/g;
    var regexResult;
    while ((regexResult = linkRegex.exec(text)) !== null) {
      var outerHtml = regexResult[0];
      var innerHtml = regexResult[1];
      if (window.webkit && window.webkit.messageHandlers.eventHandler) {
        var link = '<a href="javascript:window.spinToWin.openUrl(\'' + url + '\')">' + innerHtml + '</a>';
        text = text.replace(outerHtml, link);
      } else {
        var link = '<a href="' + url + '">' + innerHtml + '</a>';
        text = text.replace(outerHtml, link);
      }
    }
    return text;
  }
};

SpinToWin.prototype.randomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

SpinToWin.prototype.isNullOrWhitespace = function (input) {
  if (typeof input === 'undefined' || input == null) return true;
  return input.replace(/\s/g, '').length < 1;
};

SpinToWin.prototype.validateEmail = function (email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

SpinToWin.prototype.setCloseButton = function () {
  if (this.config.closeButtonColor == "black") {
    this.closeButton.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAABvUlEQVRoQ+2Z4U0DMQyFfYsxRIEN2AomQEjMgBisKG0jRac0sf2ec1ZF//Qkkvh9fo4vDZtcP08i8nN7Ll9b85zx8dyIKtp/i+BXEfnsqM0K00JU2S9FbO8PdUA2mLtaZyCZymyU8MteGA64WXO0M1ONVeB04IENQKWtzbRqwuIWpta0Lxn1xAVAJi292jctEARk1nBvE5sXIgK5Yo+6kWtBEMgdc9ZW3Qs7gKBYM5CiBwqgBIJjaECiYWAI6/GDEnDnEG1NrSM1Pi0wu2StIKwyYybkkmQPCApDh0BAvDAhECiIFSYMggGihdG8TrxlDu2RvTBNtkcwEATLEUtr7sHAEGwQT5lRICJALDA0iH+Qwa61bnqaK7SFlGen9Jvd6sQeCE4ovADgBBUGBdE4seQSEAGxQFhemi5NrknKclp61eQB8TjhOZuZtJkGg06EwlhAGE6EwWhBIiCoDUADEglBg5mBrICgwDz8JfZKJygN4GH/0XOkE5AzrSOZIMwNYMnJVHOpBf7q3ApIRifMZaYBmb1rwISrpw8TPgPJAjHdM0Xou4i8dfKSDWIE81HFfonIcwOTFaIH8y0ipz/jH10bOlDCXQAAAABJRU5ErkJggg==";
  } else {
    this.closeButton.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAABwklEQVRoQ+2aa24CMQyE7QuUM7YHK2csF0i1qJF2A0lszxiiVfkDEnnM52fCoiIipZRvEfncPm8vVdX6ecX3UkrZ6bqq6pe2EKvDNBBV7nUD2dMdHLCaZ4ZaR1+uFGZTnbMBK8CYNP4leze83p0zJoh9DlgnvLKKeTQdyqxnYjaQV8tDv/AukAEU0fC08UUWYgFF9+528OiCCBCy5/AogizsBUL3mp6p0A0sQIw9piDZfYYBcW/aFotlwbAgXCBsGCaEG4QFw4YIgaAwGRBhkChMFgQE4oXJhIBBrDCWyojeRs3ldyTGYu3RfBSC4pEqMArDgKCCRMKMBUEH8cAwIf5BeonrzROmVyhVyxNSrRFYMBQQrycyYGAQFKJCoZ6BQCwQVaBnrOUk8ODVyCRrTrRWzoQJeQQRhMwdHnO8HmEIYawBhRZTAHMtV2dnbxzNs14EmXIkA8JzaraU5ilIJgQT5vw/mb7CE228I3ue97ECYhVvT0KuA20BON+jtxU8geTM3SMrQnhL8/AvHKy7Apo7JkPPBlm6KirUMn+qczRgFQhLmG2h9SMiHxn3aIulvWM6hr/VZD/ArOaJSTW7qerlF9bSa7Pl7TDpAAAAAElFTkSuQmCC";
  }
};

SpinToWin.prototype.setTickAudio = function () {
  var tickBase64 = "data:audio/mp3;base64,SUQzAwAAAAAuX1BSSVYAAA9YAABYTVAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMwNjcgNzkuMTU3NzQ3LCAyMDE1LzAzLzMwLTIzOjQwOjQyICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6eG1wRE09Imh0dHA6Ly9ucy5hZG9iZS5jb20veG1wLzEuMC9EeW5hbWljTWVkaWEvIgogICB4bXA6TWV0YWRhdGFEYXRlPSIyMDE2LTAzLTA3VDExOjA2OjAxWiIKICAgeG1wOk1vZGlmeURhdGU9IjIwMTYtMDMtMDdUMTE6MDY6MDFaIgogICB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjQ1NTg3MzVlLTFmOTItNDU0ZS04YzZmLWRhNzI1NGVlODFiZiIKICAgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDphNTNjMzM2ZC04ZDVmLWViNDEtOGI3Zi03YTRkNzAzYjdjNGUiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphNTNjMzM2ZC04ZDVmLWViNDEtOGI3Zi03YTRkNzAzYjdjNGUiCiAgIGRjOmZvcm1hdD0iYXVkaW8vbXBlZyIKICAgeG1wRE06cGFydE9mQ29tcGlsYXRpb249ImZhbHNlIj4KICAgPHhtcE1NOkhpc3Rvcnk+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTUzYzMzNmQtOGQ1Zi1lYjQxLThiN2YtN2E0ZDcwM2I3YzRlIgogICAgICBzdEV2dDp3aGVuPSIyMDE1LTAxLTIxVDE0OjIzOjQ4WiIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgQXVkaXRpb24gQ0MgKFdpbmRvd3MpIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvbWV0YWRhdGEiLz4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6OTRmNzY3YjEtMTFmZS1mNzRjLWI1NDgtNTcwNWEzNmM3MDYyIgogICAgICBzdEV2dDp3aGVuPSIyMDE2LTAzLTA0VDE0OjAyOjM1WiIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgQXVkaXRpb24gQ0MgMjAxNS4wIChXaW5kb3dzKSIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iL21ldGFkYXRhIi8+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InNhdmVkIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjFiNmExZGNiLTczMDgtMWQ0Ni04MWQ5LTdhODlhOTkwYjgzNyIKICAgICAgc3RFdnQ6d2hlbj0iMjAxNi0wMy0wNFQxNDowMjozNVoiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIEF1ZGl0aW9uIENDIDIwMTUuMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MmZlNTVlNDYtZjUzMy0wZjRlLWIzODEtNjMwZDJiZWQwNTNjIgogICAgICBzdEV2dDp3aGVuPSIyMDE2LTAzLTA3VDExOjA2OjAxWiIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgQXVkaXRpb24gQ0MgMjAxNS4wIChXaW5kb3dzKSIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iL21ldGFkYXRhIi8+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InNhdmVkIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQ1NTg3MzVlLTFmOTItNDU0ZS04YzZmLWRhNzI1NGVlODFiZiIKICAgICAgc3RFdnQ6d2hlbj0iMjAxNi0wMy0wN1QxMTowNjowMVoiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIEF1ZGl0aW9uIENDIDIwMTUuMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8eG1wRE06VHJhY2tzPgogICAgPHJkZjpCYWc+CiAgICAgPHJkZjpsaQogICAgICB4bXBETTp0cmFja05hbWU9IkN1ZVBvaW50IE1hcmtlcnMiCiAgICAgIHhtcERNOnRyYWNrVHlwZT0iQ3VlIgogICAgICB4bXBETTpmcmFtZVJhdGU9ImY0ODAwMCIvPgogICAgIDxyZGY6bGkKICAgICAgeG1wRE06dHJhY2tOYW1lPSJDRCBUcmFjayBNYXJrZXJzIgogICAgICB4bXBETTp0cmFja1R5cGU9IlRyYWNrIgogICAgICB4bXBETTpmcmFtZVJhdGU9ImY0ODAwMCIvPgogICAgIDxyZGY6bGkKICAgICAgeG1wRE06dHJhY2tOYW1lPSJTdWJjbGlwIE1hcmtlcnMiCiAgICAgIHhtcERNOnRyYWNrVHlwZT0iSW5PdXQiCiAgICAgIHhtcERNOmZyYW1lUmF0ZT0iZjQ4MDAwIi8+CiAgICA8L3JkZjpCYWc+CiAgIDwveG1wRE06VHJhY2tzPgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5TAAAAQFUtP1MQAAe2aMP8e8Brv/sqGMylr/wCD4PYAYD1wgEypwsWU1evvjv/Lvzf/y6V//KJ/+4oZL2goZIcCifCJJCdwQDQPJBoHhm75ANAA4L2FDJDs8QAAYLx5CDQ7PEAAGC9hQwsFYL2BuDc+/dxcGgpTvcUWDQUp3hELBoHlO8EJIoZU6IkihlSgY8Rv4PvDTURMPMK7IyxqQyOlFxSljL4N5Vl9TREmSXgno9TcXMghoiOoUGaZSpZi+l1JLZuWWpW0P5idx47xtgxK5e5ZJmdjt/nOMf8/IJ4YzFof1cW/xj/xoZsmsSxsV+awVbS2/j//lsL86LYBqCykePKrqZAfr9dmiZ6qvYu0BLEAAACiAADn////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+5TAMoAAAAEuHAAAIAAAJcAAAAT//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5TA6AAngAEuAAAAIAAAJcAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUQUcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
  this.config.tickAudio = new Audio(tickBase64);
};

