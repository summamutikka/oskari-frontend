import React from 'react';
import { AdvancedSearchInputLabel, AdvancedSearchRowContainer } from './AdvancedSearchStyledComponents';

export const AdvancedSearchResourceName = (props) => {
    return <AdvancedSearchRowContainer>
        <AdvancedSearchInputLabel>Lorem Ipsum</AdvancedSearchInputLabel>
        <input type='text'/>
    </AdvancedSearchRowContainer>;
};
