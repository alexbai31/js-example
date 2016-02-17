app.controller("PaymentSettingsController", function ($scope, stripe, AuthService, APIService) {
    $scope.methods = [];
    $scope.cardForm = {};
    $scope.cardToken = "";
    $scope.cardSuffix = "";
    $scope.cardBrand = "";
    $scope.showSuccess = false;
    $scope.showError = false;

    $scope.updateMethods = function () {
        APIService.get(urls.billingProfiles.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.methods = data.objects;
        })
    };

    $scope.addCard = function () {
        stripe.card.createToken($scope.cardForm).then(function (response) {
            $scope.cardToken = response.id;
            $scope.cardSuffix = response.card.last4;
            $scope.cardBrand = response.card.brand;
            APIService.post(urls.saveStripeCustomer, {
                token: $scope.cardToken,
                brand: $scope.cardBrand,
                last4: $scope.cardSuffix,
                become_expired: $scope.cardForm.exp_year + "/" + $scope.cardForm.exp_month
            }, function (data, status) {
                if (status == 200) {
                    $scope.updateMethods();
                    $scope.showSuccess = true;
                } else {
                    $scope.showError = true;
                    $scope.error = data.error;
                }
            });
        }).catch(function (err) {
            if (err.type && /^Stripe/.test(err.type)) {
                console.log('Stripe error: ', err.message);
                $scope.showError = true;
                $scope.error = err.message;
            }
            else {
                console.log('Other error occurred, possibly with your API', err.message);
                $scope.showError = true;
                $scope.error = err.message;
            }
        });

    };

    $scope.makeCurrent = function (method) {
        APIService.put(urls.billingProfileDetail.replace(":profileId", method.id), {current: true}, function (data, status) {
            if (status == 200) {
                $scope.updateMethods();
            }
        })
    };

    $scope.removeMethod = function (method) {
        APIService.remove(urls.billingProfileDetail.replace(":profileId", method.id), {}, function (data, status) {
            if (status == 204) {
                $scope.updateMethods();
            }
        })
    };

    $scope.setExpYear = function (year) {
        $scope.cardForm.exp_year = year;
    };

    $scope.setExpMonth = function (mon) {
        $scope.cardForm.exp_month = mon;
    };

    $scope.updateMethods();
});

app.controller("CreditPackagesController", function ($scope, AuthService, APIService, stripe, $route) {
    $scope.methods = [];
    $scope.packages = [];
    $scope.selectedPackage = {};
    $scope.selectedCard = {};
    $scope.wasSelected = false;
    $scope.parseInt = parseInt;
    $scope.checkouting = false;
    $scope.showCardError = false;
    $scope.showPackageError = false;
    $scope.cardForm = {};
    $scope.countries = [];
    $scope.billingForm = {};
    $scope.balance = 0;

    $scope.cardToken = "";
    $scope.cardSuffix = "";
    $scope.cardBrand = "";

    $scope.showSuccess = false;
    $scope.showError = false;
    $scope.error = "";

    $scope.updateCountries = function () {
        APIService.get(urls.countriesList, {}, function (data, status) {
            $scope.countries = data.countries;
        })
    };

    $scope.updatePackages = function () {
        APIService.get(urls.creditPackages, {order_by: "O"}, function (data, status) {
            $scope.packages = data.objects;
        })
    };

    $scope.setCountry = function (country) {
        $scope.billingForm.country = country;
    };

    $scope.updateMethods = function () {
        APIService.get(urls.billingProfiles.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.methods = data.objects;
            if ($scope.methods.length != 0) {
                $scope.selectedCard = $scope.methods[0]
            } else {
                $scope.selectedCard = false;
            }
        })
    };

    $scope.buyPackage = function () {
        if ($scope.selectedCard && $scope.selectedPackage != {}) {
            APIService.post(urls.buyPackage, {
                "billing_profile": $scope.selectedCard.id,
                "package": $scope.selectedPackage.id
            }, function (data, status) {
                $scope.showSuccess = true;
                $scope.balance = data.balance;
                AuthService.init();
            })
        } else if (!$scope.selectedCard) {
            stripe.card.createToken($scope.cardForm).then(function (response) {
                $scope.cardToken = response.id;
                $scope.cardSuffix = response.card.last4;
                $scope.cardBrand = response.card.brand;
                APIService.post(urls.saveStripeCustomer, {
                    token: $scope.cardToken,
                    brand: $scope.cardBrand,
                    last4: $scope.cardSuffix,
                    billing_data: $scope.billingForm,
                    become_expired: $scope.cardForm.exp_year + "/" + $scope.cardForm.exp_month
                }, function (data, status) {
                    if (status == 400) {
                        $scope.showError = true;
                        $scope.error = data.error;
                    }
                    if (status == 200) {
                        APIService.post(urls.buyPackage, {
                            "billing_profile": data.billing_profile.id,
                            "package": $scope.selectedPackage.id
                        }, function (data, status) {
                            $scope.showSuccess = true;
                            $scope.balance = data.balance;
                            AuthService.init();
                        })
                    }
                });
            }).catch(function (err) {
                if (err.type && /^Stripe/.test(err.type)) {
                    console.log('Stripe error: ', err.message);
                    $scope.showError = true;
                    $scope.error = err.message;
                }
                else {
                    console.log('Other error occurred, possibly with your API', err.message);
                    $scope.showError = true;
                    $scope.error = err.message;
                }
            });
        } else if ($scope.selectedPackage == {}) {
            $scope.showPackageError = true;
        }
    };

    $scope.selectCard = function (method) {
        $scope.selectedCard = method;
    };

    $scope.selectPackage = function (pack) {
        $scope.selectedPackage = pack;
        $scope.wasSelected = true;
        $scope.updateMethods();
    };

    $scope.tryAgain = function () {
        $scope.showError = false;
    };

    $scope.setExpYear = function (year) {
        $scope.cardForm.exp_year = year;
    };

    $scope.setExpMonth = function (mon) {
        $scope.cardForm.exp_month = mon;
    };

    $scope.updateCountries();
    $scope.updatePackages();

});

app.controller("WithdrawalsController", function ($scope, AuthService, APIService) {
    $scope.availableBalanceCredit = AuthService.user.available_credit;
    $scope.availableBalanceUSD = AuthService.user.available_balance_usd;
    $scope.withdrawalForm = {
        amount: 0,
        selectedMethod: false
    };
    $scope.showSuccess = false;
    $scope.showError = false;
    $scope.withdrawals = [];
    $scope.error = "";
    $scope.withdrawalInProgress = false;

    $scope.updateWithdrawals = function () {
        APIService.get(urls.createWithdrawal, {}, function (data, status) {
            $scope.withdrawals = data.withdrawals;
            for (var i in $scope.withdrawals) {
                if ($scope.withdrawals[i].status == 'pending') {
                    $scope.withdrawalInProgress = true;
                }
            }
        })
    };

    $scope.methods = [];

    $scope.isNaN = isNaN;

    $scope.withdrawalFee = AuthService.user.withdrawal_fee;

    $scope.updateMethods = function () {
        APIService.get(urls.billingProfiles.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.methods = data.objects;
        })
    };

    $scope.selectCard = function (method) {
        $scope.withdrawalForm.selectedMethod = method;
    };

    $scope.withdraw = function () {
        APIService.post(urls.createWithdrawal, {
            user: AuthService.user.user_id,
            billing_profile: $scope.withdrawalForm.selectedMethod.id,
            amount: $scope.withdrawalForm.amount,
            fee: $scope.withdrawalForm.amount * ($scope.withdrawalFee / 100)
        }, function (data, status) {
            if (status == 201) {
                $scope.showSuccess = true;
                $scope.withdrawalInProgress = true;
            } else {
                $scope.showError = true;

                $scope.error = data.errors;
            }
        })
    };

    $scope.updateMethods();
    $scope.updateWithdrawals();
});

app.controller("WithdrawalsHistoryController", function ($scope, AuthService, APIService) {
    $scope.availableBalanceCredit = AuthService.user.available_credit;
    $scope.availableBalanceUSD = AuthService.user.available_balance_usd;
    $scope.withdrawals = [];
    $scope.total = 0;

    $scope.updateWithdrawals = function () {
        APIService.get(urls.createWithdrawal, {}, function (data, status) {
            $scope.withdrawals = data.withdrawals;
            for (var i in $scope.withdrawals) {
                $scope.total += $scope.withdrawals[i].amount;
            }
        })
    };


    $scope.updateWithdrawals();

});