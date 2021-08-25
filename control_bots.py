import asyncio
import platform
import time

from bleak import BleakClient

CUBE_ID_PURPLE = "F7:7C:30:71:FC:BA"
CUBE_ID_YELLOW = "E1:F2:90:2E:8A:91"

#Battery, LED and motor characteristics
BATTERY_CHARACTERISTIC_UUID = ("10b20108-5b3b-4571-9508-cf3efcd7bbae")
LAMP_CHARACTERISTIC_UUID = ("10b20103-5b3b-4571-9508-cf3efcd7bbae")
MOTOR_CHARACTERISTIC_UUID = ("10b20102-5b3b-4571-9508-cf3efcd7bbae")  
#In bleak, it seems that the UUID of the characteristic must be written in lowercase.

# tail the file forever
def follow(thefile):
    thefile.seek(0,2)
    while True:
        line = thefile.readline()
        if not line:
            time.sleep(0.1)
            continue
        yield line

async def spin(address, loop):
    async with BleakClient(address, loop=loop) as client:
        x = client.is_connected
        #logger.info("Connected: {0}".format(x))
        print("Connected: {0}".format(x))
        #Battery level reading
        battery = await client.read_gatt_char(BATTERY_CHARACTERISTIC_UUID)
        print("battery: {0}".format(int(battery[0])))
        #LED lights red for 160ms
        write_value = bytearray(b'\x03\x10\x01\x01\xff\x00\x00')
        await client.write_gatt_char(LAMP_CHARACTERISTIC_UUID, write_value)
        #Motor: 100 speeds in front of the left, 20 speeds in the back of the right
        write_value = bytearray(b'\x01\x01\x01\x64\x02\x02\x14')
        await client.write_gatt_char(MOTOR_CHARACTERISTIC_UUID, write_value)
        #Ends after 3 seconds
        await asyncio.sleep(3.0)

if __name__ == "__main__":
    address = (
        # discovery.Set the device address of the toio Core Cube found by py here
        CUBE_ID_PURPLE  #For Windows or Linux, specify a hexadecimal 6-byte device address.
    )
    
    f = open('command_log.txt')
    lines = follow(f)

    for command in lines:
        if command.startswith("!spin"):
            loop = asyncio.get_event_loop()
            loop.run_until_complete(spin(address, loop))