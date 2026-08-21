/**
 * Special Offer membership builder pricing (WPCode #7966).
 * Offer: NONE ACTIVE. Template between campaigns - set the offer before publishing a page.
 * Monthly dues match current join-page rates (lock in before August increase).
 */
(function () {
    function initMembershipBuilder() {
        const membershipType = document.getElementById("membershipType");
        const tierSelect = document.getElementById("tier");
        const familyOptions = document.getElementById("familyOptions");
        const numberOfChildren = document.getElementById("numberOfChildren");
        const childrenAgesContainer = document.getElementById("childrenAgesContainer");
        const priceDisplay = document.getElementById("priceDisplay");
        const minimumAmountDisplay = document.getElementById("minimumAmount");
        const originalPriceDisplay = document.getElementById("originalPrice");
        const discountedPriceDisplay = document.getElementById("discountedPrice");
        const limitedTimeText = document.getElementById("limitedTimeText");
        const purchaseButton = document.getElementById("purchaseButton");

        if (!membershipType || !tierSelect || !priceDisplay || !purchaseButton) {
            console.warn("[special-offer builder] Required DOM nodes missing — pricing not bound.");
            return;
        }

        // Current dues (same as join / WPCode #7315) — lock in before August increase
        const pricing = {
            single: [245, 225, 205],
            couple: [420, 380, 350],
            family: {
                1: [495, 445, 420],
                2: [495, 445, 420],
                3: [495, 445, 420],
                4: [495, 445, 420],
                5: [495, 445, 420],
                6: [495, 445, 420]
            }
        };

        const minimumAmounts = {
            single: "$20",
            couple: "$40",
            family: "$60"
        };

        // Standard enrollment (strikethrough) — family up to $600
        const enrollmentFees = {
            single: [400, 350, 300],
            couple: [500, 450, 400],
            family: [600, 550, 500]
        };

        // Summer special: flat $100 enrollment for all types/tiers
        const SPECIAL_ENROLLMENT = 100;

        function updatePrice() {
            const type = membershipType.value;
            const tier = parseInt(tierSelect.value, 10);
            let price = pricing[type][tier - 1];

            if (type === "family") {
                const numChildren = parseInt(numberOfChildren.value, 10);
                const basePrice = pricing.family[numChildren][tier - 1];
                let additionalCharge = 0;
                let allFieldsFilled = true;

                const childrenAges = [];
                for (let i = 1; i <= numChildren; i++) {
                    const ageInput = document.getElementById(`age${i}`);
                    const age = parseInt(ageInput.value, 10);

                    if (isNaN(age) || ageInput.value === "") {
                        allFieldsFilled = false;
                    } else {
                        childrenAges.push(age);

                        if (age > 17) {
                            additionalCharge += (i === 1) ? 90 : 100 - (i - 1) * 10;
                        }

                        if (age > 13 && age <= 17) {
                            additionalCharge += 15;
                        }
                    }
                }

                if (allFieldsFilled) {
                    const averageAge = childrenAges.reduce((a, b) => a + b, 0) / childrenAges.length;
                    if (averageAge <= 6 && numChildren <= 2) {
                        const youngChildDiscounts = { 1: 30, 2: 20 };
                        if (youngChildDiscounts[numChildren]) {
                            additionalCharge -= youngChildDiscounts[numChildren];
                        }
                    }

                    for (let i = 3; i <= numChildren; i++) {
                        const age = childrenAges[i - 1];
                        if (age > 4) {
                            additionalCharge += 20;
                        }
                    }

                    price = basePrice + additionalCharge;
                } else {
                    price = basePrice;
                }
            }

            priceDisplay.textContent = `Monthly Due: $${price}`;
        }

        function updateEnrollmentFee() {
            const type = membershipType.value;
            const tier = parseInt(tierSelect.value, 10);
            const originalPrice = enrollmentFees[type][tier - 1];

            originalPriceDisplay.textContent = `$${originalPrice}`;
            discountedPriceDisplay.textContent = `$${SPECIAL_ENROLLMENT}`;
            if (limitedTimeText) {
                limitedTimeText.textContent = "OFFER NOT SET — update this snippet before publishing";
                limitedTimeText.style.display = "inline";
            }
        }

        function updateMinimumAmount() {
            const type = membershipType.value;
            const minimumAmount = minimumAmounts[type];
            minimumAmountDisplay.textContent = `Monthly Food & Beverage Assessment: ${minimumAmount}`;
        }

        function updateChildrenAges() {
            const numChildren = parseInt(numberOfChildren.value, 10);
            childrenAgesContainer.innerHTML = "";

            for (let i = 1; i <= numChildren; i++) {
                const ageGroup = document.createElement("div");
                ageGroup.classList.add("age-group");

                const label = document.createElement("label");
                label.textContent = `Child ${i} Age:`;
                const input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.max = "24";
                input.id = `age${i}`;
                input.name = `age${i}`;
                input.placeholder = "";

                input.addEventListener("input", updatePrice);

                ageGroup.appendChild(label);
                ageGroup.appendChild(input);
                childrenAgesContainer.appendChild(ageGroup);
            }
        }

        membershipType.addEventListener("change", function () {
            if (membershipType.value === "family") {
                familyOptions.style.display = "block";
                updateChildrenAges();
            } else {
                familyOptions.style.display = "none";
                childrenAgesContainer.innerHTML = "";
            }
            updatePrice();
            updateEnrollmentFee();
            updateMinimumAmount();
        });

        tierSelect.addEventListener("change", function () {
            updatePrice();
            updateEnrollmentFee();
        });

        numberOfChildren.addEventListener("change", function () {
            updateChildrenAges();
            updatePrice();
            updateEnrollmentFee();
        });

        updatePrice();
        updateEnrollmentFee();
        updateMinimumAmount();

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        purchaseButton.addEventListener("click", function () {
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();

            if (!name) {
                alert("Please enter your full name.");
                return;
            }

            if (!email) {
                alert("Please enter your email address.");
                return;
            }

            if (!phone) {
                alert("Please enter your phone number.");
                return;
            }

            if (!isValidEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }

            const membershipTypeValue = membershipType.value;
            const tier = tierSelect.value;
            let childrenAges = [];
            let numberOfChildrenValue = null;

            if (membershipTypeValue === "family") {
                numberOfChildrenValue = numberOfChildren.value;

                for (let i = 1; i <= numberOfChildrenValue; i++) {
                    const ageInput = document.getElementById(`age${i}`);
                    if (ageInput) {
                        const ageValue = ageInput.value.trim();
                        if (ageValue === "") {
                            alert(`Please fill in the age for Child ${i}.`);
                            return;
                        }
                        childrenAges.push(ageValue);
                    }
                }
            }

            const enrollmentFee = discountedPriceDisplay.textContent.replace("$", "").trim();
            const monthlyDue = priceDisplay.textContent.replace("Monthly Due: $", "").trim();
            const foodBeverageMinimum = minimumAmountDisplay.textContent.replace("Monthly Food & Beverage Assessment: $", "").trim();

            const data = {
                Name: name,
                "Email address": email,
                Phone: phone,
                membershipType: membershipTypeValue,
                tier,
                numberOfChildren: numberOfChildrenValue,
                childrenAges,
                enrollmentFee,
                monthlyDue,
                foodBeverageMinimum,
                offer: "UNSET-set-before-launch"
            };

            console.log("Form data being sent:", data);

            fetch("https://still-cliffs-89444-6c029a7a2024.herokuapp.com/create-signature-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
                .then((response) => response.json())
                .then((result) => {
                    if (result.error) {
                        alert("Failed to create signature request: " + result.error);
                    } else {
                        alert("Thank you! A membership form has been sent to the email address you provided!");

                        /* --- conversion tracking: one push per successful signature request (no PII) --- */
                        try {
                            window.dataLayer = window.dataLayer || [];
                            window.dataLayer.push({
                                event: 'membership_requested',
                                membership_type: membershipTypeValue || null,
                                membership_tier: tier || null,
                                membership_children: Number(numberOfChildrenValue) || 0,
                                membership_enrollment_fee: Number(String(enrollmentFee).replace(/[^0-9.]/g, '')) || null,
                                membership_monthly_due: Number(String(monthlyDue).replace(/[^0-9.]/g, '')) || null,
                                membership_builder: '7966'
                            });
                        } catch (e) { /* never let tracking break the confirmation */ }
                        /* --- end conversion tracking --- */

                        fetch("https://still-cliffs-89444-6c029a7a2024.herokuapp.com/notify-admin", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(data)
                        })
                            .then((response) => {
                                if (response.ok) {
                                    console.log("Admin notified of membership click.");
                                }
                            })
                            .catch((error) => console.error("Error notifying admin:", error));
                    }
                })
                .catch(() => alert("Failed to create signature request. Please check your input."));
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initMembershipBuilder);
    } else {
        initMembershipBuilder();
    }
})();
