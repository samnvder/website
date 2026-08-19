/* ========================================================================== */
/* WPCode #7315                                                             */
/* Title: "JS - Build Your Membership (Discounted Enrollment)               */
/*         - with email notification"                                       */
/* ========================================================================== */
/* REUSABLE OFFER TEMPLATE, fixed-dollar variant. Like #7966, the owner     */
/* re-edits this per promotion rather than replacing it. Derived from       */
/* #9926, which is the original no-discount builder.                        */
/*                                                                          */
/* Status:  ACTIVE -- toggle confirmed ON in WPCode 2026-08-18.             */
/*                                                                          */
/* Currently: enrollment discounts of single $100, couple $100, family $150,*/
/* subtracted from the sticker fee and shown as a strikethrough. It MUST    */
/* keep its discounts const -- the guard fails if it disappears, which is   */
/* how a promo page would silently start quoting sticker enrollment.        */
/*                                                                          */
/* ⚠ BEFORE THE NEXT OFFER -- this holds the last campaign's values:         */
/*   1. discounts { single, couple, family } -- the offer itself            */
/*   2. pricing / enrollmentFees / minimumAmounts -- must match the join    */
/*      page unless the offer deliberately changes them                     */
/*   3. limitedTimeText -- this builder only sets display, the wording      */
/*      lives in the PAGE markup, so check the page too                     */
/* Then re-capture into this file, and update membership-pricing-source.json*/
/* so the guard is checking the new numbers rather than the old ones.       */
/*                                                                          */
/* Captured 2026-08-18 and byte-identical (ignoring line endings) to        */
/* .../memberships/Discounted Enrollment/membership builder JS.js.          */
/* Re-check with:  npm run guard:membership-pricing                         */
/* ========================================================================== */
document.addEventListener("DOMContentLoaded", function () {
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

    // Pricing data
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

    const enrollmentFees = {
        single: [400, 350, 300],
        couple: [500, 450, 400],
        family: [600, 550, 500]
    };

    const discounts = {
        single: 100,
        couple: 100,
        family: 150
    };

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
                    additionalCharge -= numChildren === 1 ? 30 : 20;
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
        const discount = discounts[type];
        const discountedPrice = originalPrice - discount;

        originalPriceDisplay.textContent = `$${originalPrice}`;
        discountedPriceDisplay.textContent = `$${discountedPrice}`;
        limitedTimeText.style.display = "inline";
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

    // Function to validate email format using regex
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    document.getElementById("purchaseButton").addEventListener("click", function () {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim(); // New phone field

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

        const enrollmentFee = discountedPriceDisplay.textContent.replace('$', '').trim();
        const monthlyDue = priceDisplay.textContent.replace('Monthly Due: $', '').trim();
        const foodBeverageMinimum = minimumAmountDisplay.textContent.replace('Monthly Food & Beverage Assessment: $', '').trim();

        const data = {
            Name: name,
            "Email address": email,
            Phone: phone, // Include phone in the data
            membershipType: membershipTypeValue,
            tier,
            numberOfChildren: numberOfChildrenValue,
            childrenAges,
            enrollmentFee,
            monthlyDue,
            foodBeverageMinimum
        };

        console.log('Form data being sent:', data);

        fetch('https://still-cliffs-89444-6c029a7a2024.herokuapp.com/create-signature-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                alert('Failed to create signature request: ' + result.error);
            } else {
                alert('Thank you! A membership form has been sent to the email address you provided!');

                // Notify admin of membership click
                fetch('https://still-cliffs-89444-6c029a7a2024.herokuapp.com/notify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                .then(response => {
                    if (response.ok) {
                        console.log("Admin notified of membership click.");
                    }
                })
                .catch(error => console.error('Error notifying admin:', error));
            }
        })
        .catch(error => alert('Failed to create signature request. Please check your input.'));
    });
});
