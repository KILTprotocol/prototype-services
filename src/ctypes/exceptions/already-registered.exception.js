"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var exceptions_1 = require("@nestjs/common/exceptions");
var common_1 = require("@nestjs/common");
var AlreadyRegisteredException = /** @class */ (function (_super) {
    __extends(AlreadyRegisteredException, _super);
    function AlreadyRegisteredException() {
        return _super.call(this, 'Already registered', common_1.HttpStatus.BAD_REQUEST) || this;
    }
    return AlreadyRegisteredException;
}(exceptions_1.HttpException));
exports.AlreadyRegisteredException = AlreadyRegisteredException;
