/**
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
    ExtendedClaimInterface,
    ExtendedExternalClaimInterface,
    SelectedDialectInterface
} from "../../features/applications/components/settings";
import { ClaimManagementConstants } from "../../features/claims";

function isClaimInterface(
    claim: ExtendedClaimInterface | ExtendedExternalClaimInterface
): claim is ExtendedClaimInterface {
    if ((claim as ExtendedExternalClaimInterface).mappedLocalClaimURI == undefined) {
        return true;
    }
    return false;
}

/**
 * Check whether claims is  identity claims or not.
 *
 * @param claim claim
 */
const isIdentityClaim = (claim: ExtendedClaimInterface | ExtendedExternalClaimInterface): boolean => {
    const identityRegex = new RegExp("wso2.org/claims/identity");
    if (isClaimInterface(claim)) {
        return identityRegex.test(claim.claimURI);
    }
    return identityRegex.test(claim.mappedLocalClaimURI);
};

export const applicationConfig = {
    advancedConfigurations: {
        showEnableAuthorization: false,
        showSaaS: false
    },
    attributeSettings: {
        advancedAttributeSettings: {
            showIncludeTenantDomain: false,
            showIncludeUserstoreDomainRole: false,
            showIncludeUserstoreDomainSubject: false,
            showRoleAttribute: false,
            showRoleMapping: false,
            showUseMappedLocalSubject: false
        },
        attributeSelection: {
            getClaims: (claims: ExtendedClaimInterface[]): ExtendedClaimInterface[] => {
                return claims.filter(claim => isIdentityClaim(claim) == false);
            },
            getExternalClaims: (claims: ExtendedExternalClaimInterface[]): ExtendedExternalClaimInterface[] => {
                return claims.filter(claim => isIdentityClaim(claim) == false);
            },
            showAttributePlaceholderTitle: false,
            showShareAttributesHint: (selectedDialect: SelectedDialectInterface): boolean => {
                return selectedDialect.id === ClaimManagementConstants.ATTRIBUTE_DIALECT_IDS.get("OIDC");
            }
        },
        makeSubjectMandatory: false,
        roleMapping: false
    },
    editApplication: {
        showProvisioningSettings: false
    },
    inboundOIDCForm: {
        shouldValidateCertificate: false,
        showClientSecretMessage: false,
        showFrontChannelLogout: false,
        showScopeValidators: false
    }
};
