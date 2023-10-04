/**
 * Copyright (c) 2023, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
 *
 * This software is the property of WSO2 LLC. and its suppliers, if any.
 * Dissemination of any information or reproduction of any material contained
 * herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
 * You may not alter or remove any copyright or other notice from copies of this content.
 */

import { useContext } from "react";
import { 
    UIConfigContext, 
    UIConfigContextInterface 
} from "../contexts/ui-config-context";

const useUIConfig = (): UIConfigContextInterface => {
    const context = useContext(UIConfigContext);

    if (!context) {
        throw new Error('useResourceEndpoints must be used within a ResourceEndpointsProvider');
    }

    const { UIConfig, setUIConfig } = useContext(UIConfigContext);

    return {
        UIConfig,
        setUIConfig
    };
};

export default useUIConfig;
