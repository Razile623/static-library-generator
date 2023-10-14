#include "fapi_ext.h"
#include "nfapi_interface.h"
#include "nfapi_conv.h"

#include <string.h>

inline void nfapi_toBigEnd16(uint8_t  *pucOut, uint16_t value)
{
    pucOut[ 0 ] = value & 0xFF;
    pucOut[ 1 ] = ( value >> 8 ) & 0xFF;
}

inline void nfapi_toBigEnd32(uint8_t  *pucOut, uint32_t value)
{
    pucOut[ 0 ] = value & 0xFF;
    pucOut[ 1 ] = ( value >> 8 ) & 0xFF;
    pucOut[ 2 ] = ( value >> 16 ) & 0xFF;
    pucOut[ 3 ] = ( value >> 24 ) & 0xFF;
}

inline int32_t nfapi_createP5Header( uint16_t  usPhyId,
                              uint16_t  usMsgType,
                              uint16_t  usMsgLen,
                              uint8_t  *ptNfapiMsg )  // [out] nFAPI message
{
    int32_t  iOutcome = 0;
    
    memset(ptNfapiMsg, 0, 8);
    
    nfapi_toBigEnd16( &ptNfapiMsg[ 0 ], usPhyId );
    nfapi_toBigEnd16( &ptNfapiMsg[ 2 ], usMsgType );
    nfapi_toBigEnd16( &ptNfapiMsg[ 4 ], usMsgLen );
    
    return iOutcome;
}

inline int32_t nfapi_createP7Header( uint16_t  usPhyId,
                              uint16_t  usMsgType,
                              uint16_t  usMsgLen,
                              uint8_t   ucM,
                              uint8_t   ucSegmentNum,
                              uint8_t   ucSequenceNum,
                              uint32_t  uiCheckSum,
                              uint32_t uiTimeStamp,
                              uint8_t  *ptNfapiMsg )  // [out] nFAPI message
{
    int32_t  iOutcome    = 0;
    uint16_t usTemp      = 0;
    
    memset(ptNfapiMsg, 0, 16);
    
    nfapi_toBigEnd16( &ptNfapiMsg[ 0 ], usPhyId );
    nfapi_toBigEnd16( &ptNfapiMsg[ 2 ], usMsgType );
    nfapi_toBigEnd16( &ptNfapiMsg[ 4 ], usMsgLen );
    
    usTemp = ucM;
    usTemp = ( usTemp << 7 ) & ( ucSegmentNum & 0x7F );
    usTemp = ( usTemp << 8 ) & ucSequenceNum;
    nfapi_toBigEnd16( &ptNfapiMsg[ 6 ], usTemp );
    
    nfapi_toBigEnd32( &ptNfapiMsg[ 8 ], uiCheckSum );
    nfapi_toBigEnd32( &ptNfapiMsg[ 12 ], uiTimeStamp );
    
    return iOutcome;
}


int32_t nfapi_toTlv( uint16_t  usTag,
                     uint16_t  length,
                     uint8_t  *value,
                     uint8_t  *pucOut )  // [out] 
{
    int32_t  iOutcome = 0;
    
    nfapi_toBigEnd16( pucOut, usTag );
    pucOut += 2;
    nfapi_toBigEnd16( pucOut, length );
    pucOut += 2;
    
    if( length == 2 ){
        
        nfapi_toBigEnd16( pucOut, *( (uint16_t *)value ) );
    }else if( length == 4 ){
        
        nfapi_toBigEnd32( pucOut, *( (uint32_t *)value ) );
    }else{
        
        memcpy( pucOut, value, length);
    }
    
    return iOutcome;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function Name:    fapi_nFapiConvertPARAMrequest
// Description:      Convert SCF FAPI PARAM.request to nFAPI object
// Attention:
// Calling Sequence:
// Arguments:
// Return Value(s):  Returns 0 (OK) or 1 (NG)
// Explanations:
// End:
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


int32_t nfapi_convParamRequest( STR_EXT_FAPI_PARAM_REQ *ptParamReq,       // [in] SCF FAPI PARAM.request object
                                 uint16_t                 usPhyId,
                                 uint8_t                 *ptNfapiMsg )       // [out] nFAPI message
{
    int32_t  iOutcome = 0;
    uint16_t usMsgLen = 0;
    uint8_t  ucNumOfTlvs = 0;

    STR_EXT_FAPI_TLV_FORMAT *ptTLV;
    
    // PUT_OBJ( out=&ptNfapiMsg[ 8 ], len=&usMsgLen ) 
    // {
    //     // ucNumOfTlvs = ptParamReq->tConfigReq.ucNumTlvs;

    //     // // Number of TLV
    //     // PUT_VAL8( ucNumOfTlvs );

    //     // // TLVs
    //     // FOREACH( limit=ucNumOfTlvs )
    //     // {
    //     //     ptTLV = &ptParamReq->tTlvs[INDEX];

    //     //     PUT_VAL16( ptTLV->ucTag );
    //     //     PUT_VAL16( ptTLV->ucLength );
    //     //     PUT_VAL16( ptTLV->usValue );
            
    //     // }ENDLOOP;

    // }ENDOBJ;
    
    // Add length of header
    usMsgLen = 0;
    
    iOutcome = nfapi_createP5Header( usPhyId, 0x00, usMsgLen, &ptNfapiMsg[ 0 ] );
    
    // 3. Return outcome
    return iOutcome;

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function Name:    fapi_nFapiConvertSRSInd
// Description:      Convert SCF FAPI SRS.Indication to nFAPI object
// Attention:
// Calling Sequence:
// Arguments:
// Return Value(s):  Returns 0 (OK) or 1 (NG)
// Explanations:
// End:
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


int32_t nfapi_convSrsIndication( STR_EXT_FAPI_SRS_IND    *ptSrsInd,     // [in] SCF FAPI SRS.indication object
                                 uint16_t                 usPhyId,
                                 uint8_t                  ucM,
                                 uint8_t                  ucSegmentNum,
                                 uint8_t                  ucSequenceNum,
                                 uint32_t                 uiTimeStamp,
                                 uint8_t                 *ptNfapiMsg )  // [out] nFAPI message
{
    int32_t  iOutcome = 0;
    
    uint32_t uiCheckSum = 0;
    uint16_t usMsgLen   = 0;
    uint8_t  ucNumOfUe = 0;
    uint8_t ucNumberOfRB = 0;
    uint8_t numOfSubbands = 0;
    uint8_t NumAntennas = 0;
    
    STR_EXT_FAPI_SRS_IND_UE *ptSrcSrsIndUeInfo;
    STR_EXT_FAPI_SRS_TDD_CHANNEL_MEASUREMENT_SUBBAND *ptSrsIndTddChannelSubband;

    
    PUT_OBJ( out=&ptNfapiMsg[ 16 ], len=&usMsgLen ) 
    {
        // SFN/SF
        PUT_VAL16( ptSrsInd->tSrsInd.tSrsIndMsgBody.usSfnSf );
        
        // SRS Ind Body
        PUT_TLV_OBJ( tag=0x2034 )  //optional params: out, len
        {    
            ucNumOfUe = ptSrsInd->tSrsInd.tSrsIndMsgBody.tSrsIndBody.ucNumOfUe;
            
            PUT_VAL8(ucNumOfUe);
            
            FOREACH( limit=ucNumOfUe )
            {
                //TODO: set objects here
                ptSrcSrsIndUeInfo   = &ptSrsInd->tSrsIndBody.tSrsIndUe[ INDEX ];
                
                // Instance Length
                PUT_VAL16( 0 );  //TODO: no value to set
                
                // 0x2038: RX UE Information
                {
                    PUT_TLV_OBJ( tag=0x2038 )  //optional params: out, len
                    {
                        PUT_VAL32( ptSrcSrsIndUeInfo->tRxUeInfo.uiHandle );
                        PUT_VAL16( ptSrcSrsIndUeInfo->tRxUeInfo.usRnti );
                    }ENDTLV;

                }


                // 0x2035: Release 8 parameters
                {
                    PUT_TLV_OBJ( tag=0x2035 )  //optional params: out, len
                    {
                        PUT_VAL16( ptSrcSrsIndUeInfo->tSrsRel8Param.usDopplerEstimation );
                        PUT_VAL16( ptSrcSrsIndUeInfo->tSrsRel8Param.usTimingAdvance );
                        PUT_VAL8( ptSrcSrsIndUeInfo->tSrsRel8Param.ucNumOfResourceBlocks );
                        PUT_VAL8( ptSrcSrsIndUeInfo->tSrsRel8Param.ucRbStart );

                        ucNumberOfRB = ptSrcSrsIndUeInfo->tSrsRel8Param.ucNumOfResourceBlocks;

                        // Number of RB
                        FOREACH( limit=ucNumberOfRB )
                        {
                            PUT_VAL8( ptSrcSrsIndUeInfo->tSrsRel8Param.ucSnr[INDEX] );

                        }ENDLOOP;

                    }ENDTLV;
                
                }
                
                // 0x2036: Release 9 parameters
                {
                    PUT_TLV_OBJ( tag=0x2036 )  //optional params: out, len
                    {                        
                        PUT_VAL16( ptSrcSrsIndUeInfo->tSrsRel9Param.usTimingAdvanceR9 );


                    }ENDTLV;

                }
                
                // 0x2037: Release 10 TDD parameters
                {
                    PUT_TLV_OBJ( tag=0x2037 )  //optional params: out, len
                    {
                        PUT_VAL8( ptSrcSrsIndUeInfo->tSrsRel10Param.ucUpPtsSymbol );

                    }ENDTLV;

                }
                
                // 0x2054: TDD Channel Measurement
                {                    
                    PUT_TLV_OBJ( tag=0x2054 )  //optional params: out, len
                    {
                        PUT_VAL8( ptSrcSrsIndUeInfo->tSrsTddChannelMeasurement.ucNumPrbPerSubband );
                        PUT_VAL8( ptSrcSrsIndUeInfo->tSrsTddChannelMeasurement.ucNumOfSubbands );
                        PUT_VAL8( ptSrcSrsIndUeInfo->tSrsTddChannelMeasurement.ucNumAntennas );

                        numOfSubbands = ptSrcSrsIndUeInfo->tSrsTddChannelMeasurement.ucNumOfSubbands;
                        NumAntennas = ptSrcSrsIndUeInfo->tSrsTddChannelMeasurement.ucNumAntennas;

                        // Number of Subbands
                        FOREACH( limit=numOfSubbands )
                        {
                            
                            ptSrsIndTddChannelSubband = &ptSrcSrsIndUeInfo->tSrsTddChannelMeasurement.tSrsTddChannelMeasurementSubbands[ INDEX ];

                            // Subband Index
                            PUT_VAL8( ptSrsIndTddChannelSubband->subbandIndex );

                            // Number of Antennas
                            FOREACH( limit=NumAntennas )
                            {
                                // Number of Channels
                                PUT_VAL16( ptSrsIndTddChannelSubband->usChannel[INDEX] );

                            }ENDLOOP;

                        }ENDLOOP;

                    }ENDTLV;
                }
                
                // 0x2053: Release 11 parameters
                {
                    PUT_TLV_OBJ( tag=0x2053 )  //optional params: out, len
                    {
                        
                        PUT_VAL16( ptSrcSrsIndUeInfo->tSrsRel11Param.usUlRtoa );

                    }ENDTLV;
                }
            }ENDLOOP;
        }ENDTLV;
    }ENDOBJ;
    
    // Add length of header
    usMsgLen += 16;
    
    iOutcome = nfapi_createP7Header( usPhyId, NFAPI_SRS_INDICATION, usMsgLen, ucM, ucSegmentNum, ucSequenceNum, uiCheckSum, uiTimeStamp, &ptNfapiMsg[ 0 ] );
    
    // 3. Return outcome
    return iOutcome;
}
