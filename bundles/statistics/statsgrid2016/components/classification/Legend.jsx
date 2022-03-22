import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { InactiveLegend } from './legend/InactiveLegend';
import { LegendRow } from './legend/LegendRow';

const Container = styled.div`
    margin: 0 auto;
    width: 90%;
    overflow: hidden;
`;

export const Legend = ({
    transparency,
    mapStyle,
    classifiedDataset
}) => {
    const { error } = classifiedDataset;
    if (error) {
        const errorKey = error === 'general' ? 'cannotCreateLegend' : error;
        return (<InactiveLegend error = {errorKey} />);
    }
    const opacity = transparency / 100 || 1;
    const { groups } = classifiedDataset;
    const maxSizePx = groups[groups.length - 1].sizePx;
    return (
        <Container>
            { groups.map((group, i) =>
                <LegendRow key={`item-${i}`}
                    opacity={opacity}
                    mapStyle={mapStyle}
                    maxSizePx={maxSizePx}
                    { ...group }
                />
            )}
        </Container>
    );
};

Legend.propTypes = {
    transparency: PropTypes.number.isRequired,
    mapStyle: PropTypes.string.isRequired,
    classifiedDataset: PropTypes.object.isRequired
};
