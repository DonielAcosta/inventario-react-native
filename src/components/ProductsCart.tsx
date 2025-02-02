import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, FlatList, Pressable, TextInput } from 'react-native'
import { MinusSmallIcon, PlusSmallIcon, XMarkIcon } from 'react-native-heroicons/outline'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { AlertDialog, Button, Modal } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { disponibility } from '../utils/constants'
import ProductoInterface from '../interfaces/ProductoInterface'
import useInv from '../hooks/useInv'
import useLogin from '../hooks/useLogin'

const ProductsCart = ({ product }: { product: ProductoInterface }) => {
  const [added, setAdded] = useState(true)
  const [ammount, setAmmount] = useState(1)
  const [ammountInput, setAmmountInput] = useState('')
  const [touch, setTouch] = useState(false)
  
  const [alertRemoveElement, setAlertRemoveElement] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [disableAcept, setDisableAcept] = useState(false)
  
  const { themeColors: { typography, lightList, darkTurquoise, green, turquoise, icon, primary, list, processBtn } } = useLogin()
  const { removeElement, productsCart, setProductsCart } = useInv()
  const { descrip, precio1, codigo, centro, merida, oriente } = product
  const cancelRef = useRef(null)
  const initialRef = useRef(null)
  const navigation = useNavigation()

  const onCloseAlertRemoveElement = () => setAlertRemoveElement(false)

  // -----------------------------------------------
  // ACTIONS
  // -----------------------------------------------

  // Refresh data when cart change
  useEffect(() => {
    const productInCart = productsCart.find(productInCart => productInCart.codigo === codigo)
    if (productInCart !== undefined) { 

      // product in cart
      setAdded(true)
      setAmmount(productInCart.ammount)
      setAmmountInput(String(productInCart.ammount))
    } else {

      // product not in cart
      setAdded(false)
      setAmmount(1)
      setAmmountInput(String(1))
    }
  }, [productsCart])

  // Add or remove element from cart
  // useEffect(() => {
  //   if (!added) {
  //     removeElement(codigo)
  //   }
  // }, [added])
  useEffect(() => {
    if(!added && touch) {
      if (productsCart.find(productInCart => productInCart.codigo === codigo)) {
        setTouch(false)
        removeElement(codigo)
      }
    }
  }, [added])

  // Change 'cantidad' (input)
  useEffect(() => {
    const productInCart = productsCart.find(item => item.codigo === codigo)

    // btns
    if ( 
      // igual, mayor o menor (y no es cero)
      productInCart.ammount === Number(ammountInput) || 
      productInCart.ammount < Number(ammountInput) || 
      productInCart.ammount > Number(ammountInput) && Number(ammountInput) !== 0
    ) {
      setDisableAcept(false)
    } else if ( 
      // cero o NaN
      Number(ammountInput) === 0 || 
      Number(ammountInput) < 0
    ) {
      setDisableAcept(true)
    }
  }, [ammountInput])

  // Btn acept (input)
  const acept = () => {
    const updatedProductsCart = productsCart.map(item => {
      if (item.codigo === codigo) {
        const cleanCantidad = parseInt(String(ammountInput).replace(/-/g, ''))

        return { ...item, ammount: cleanCantidad }
      } else {
        return { ...item }
      }
    })
    setProductsCart(updatedProductsCart)
    setOpenModal(false)
  }

  // Handle actions
  const handleDecrease = () => {
    if (ammount > 1) {
      setAmmount(ammount - 1)
    }
  }
  const handleIncrease = () => {
    setAmmount(ammount + 1)
  }
  const handleRemoveElement = () => {
    if (productsCart.length === 1) {
      setProductsCart([])
    }

    setAdded(false)
    setAmmount(1)
    setTouch(true)
    setAlertRemoveElement(false)
  }

  return (
    <>
      {added && (
        <View className='flex flex-col mb-3 p-2 rounded-2xl' style={{ backgroundColor: lightList }}>

          {/* descrip & remove */}
          <View className='flex flex-row items-center justify-between'>
            
            {/* descrip */}
            <Pressable onPress={() => navigation.navigate('Product', { ...product })}>
              <Text style={{ fontSize: wp(4), color: typography }} className='font-bold max-w-[85%]' numberOfLines={1}>
                {descrip}
              </Text>
            </Pressable>

            <View className='pl-5'>
              <TouchableOpacity onPress={() => setAlertRemoveElement(true)} className='flex flex-row items-center justify-center rounded-md w-7 h-7'>
                <XMarkIcon size={20} color={icon} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>

          {/* info */}
          <View className='flex flex-row justify-center'>

            {/* left info */}
            <View className='w-1/2 pr-2 my-2'>

              {/* disponibility */}
              <View className='mb-2'>
                <Text style={{ fontSize: hp(1.6), color: typography }} className='pb-0.5 font-bold'>
                  Disponibilidad:
                </Text>

                {/* sedes */}
                <View className='px-3'>
                  <FlatList
                    data={disponibility}
                    horizontal={true}
                    contentContainerStyle={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: { id, name } }) => {
                      return (
                        <View key={id} className='flex flex-col items-center'>
                          <Text style={{ fontSize: hp(1.5), color: darkTurquoise }} className='w-10 text-center font-bold'>
                            {name}
                          </Text>

                          <Text style={{ fontSize: hp(1.6), color: typography }} className='text-center font-bold'>
                            {
                              name === 'Mérida' ? parseInt(String(merida)) :
                              name === 'Centro' ? parseInt(String(centro)) :
                              name === 'Oriente' ? parseInt(String(oriente)) : null
                            }
                          </Text>
                        </View>
                      )
                    }}
                  />
                </View>
              </View>
            </View>

            {/* right info */}
            <View className='w-1/2 pl-2'>

              {/* price */}
              <View className='my-2'>
                <Text style={{ fontSize: hp(1.5), color: typography }} className='font-bold'>
                  Precio:
                </Text>

                <Text style={{ fontSize: hp(2.2), color: darkTurquoise }} className='font-bold'>
                  Bs. {precio1}
                </Text>
              </View>

              {/* ammount and added */}
              <View className='flex flex-row items-center justify-between w-full'>

                <View className='flex-1 flex-row items-center justify-around'>

                  {/* decrease */}
                  <View className='rounded-md' style={{ borderColor: turquoise, borderWidth: .5 }}>
                    <TouchableOpacity onPress={handleDecrease} className='p-0.5'>
                      <MinusSmallIcon size={wp(4.5)} color={darkTurquoise} strokeWidth={3} />
                    </TouchableOpacity>
                  </View>

                  {/* ammount */}
                  <View style={{ width: wp(12) }}>
                    <TouchableOpacity onPress={() => setOpenModal(true)}>
                      <Text style={{ color: darkTurquoise, fontSize: wp(4.5) }} className='text-center'>
                        {ammount}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* increase */}
                  <View className='rounded-md' style={{ borderColor: turquoise, borderWidth: .5 }}>
                    <TouchableOpacity onPress={handleIncrease} className='p-0.5'>
                      <PlusSmallIcon size={17} color={darkTurquoise} strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </View>

          {/* info */}
          </View>

        </View>
      )}

      {/* modal input */}
      <Modal isOpen={openModal} initialFocusRef={initialRef}>
        <Modal.Content style={{ width: 350, paddingHorizontal: 25, paddingVertical: 20, borderRadius: 25 }}>

          <Text className='text-center mb-3' style={{ fontSize: wp(5), color: typography }}>Cantidad</Text>

          {/* input */}
          <View className='w-full rounded-xl mb-4' style={{ backgroundColor: list }}>
            <TextInput className='h-12 text-center rounded-xl' style={{ color: turquoise, fontSize: wp(5) }}
              keyboardType='numeric'
              value={String(ammountInput)}
              onChangeText={text => setAmmountInput(text)}
              autoFocus
              selectionColor={primary}
            />
          </View>
          
          {/* btns */}
          <View className='flex flex-row items-center justify-between'>
            <View style={{ backgroundColor: green }} className='flex justify-center w-[48%] rounded-xl'>
              <TouchableOpacity onPress={() => {
                setOpenModal(false)
                setAmmountInput(String(ammount))
              }}>
                <Text style={{ fontSize: wp(4.5) }} className='py-2 text-center font-bold text-white'>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: `${disableAcept ? processBtn : green}` }} className='flex justify-center w-[48%] rounded-xl'>
              <TouchableOpacity onPress={() => acept()} disabled={disableAcept}>
                <Text style={{ fontSize: wp(4.5) }} className='py-2 text-center font-bold text-white'>
                  Aceptar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </Modal.Content>
      </Modal>

      {/* alert clear cart */}
      <AlertDialog leastDestructiveRef={cancelRef} isOpen={alertRemoveElement} onClose={onCloseAlertRemoveElement}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Eliminar producto</AlertDialog.Header>
          <AlertDialog.Body>
            ¿Estás seguro que deseas eliminar este producto del carrito?
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button variant='unstyled' colorScheme='coolGray' onPress={onCloseAlertRemoveElement} ref={cancelRef}>
                Cancelar
              </Button>
              <Button color={darkTurquoise} onPress={handleRemoveElement}>
                Aceptar
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  )
}

export default ProductsCart